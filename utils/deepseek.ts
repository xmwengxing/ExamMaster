/**
 * DeepSeek API 工具函数
 * 用于统一管理 DeepSeek API 调用
 */

interface DeepSeekConfig {
  userApiKey?: string;
  adminApiKey?: string;
}

/**
 * 获取有效的 API Key
 * 优先级：学员个人配置 > 管理员全局配置
 */
export function getEffectiveApiKey(config: DeepSeekConfig): string | null {
  console.log('[getEffectiveApiKey] 输入配置:', {
    hasUserKey: !!config.userApiKey,
    userKeyLength: config.userApiKey?.length || 0,
    userKeyValue: config.userApiKey,
    hasAdminKey: !!config.adminApiKey,
    adminKeyLength: config.adminApiKey?.length || 0
  });
  
  // 检查用户API Key是否有效（不为空、不为"null"、不为"undefined"字符串）
  if (config.userApiKey && 
      config.userApiKey.trim() && 
      config.userApiKey !== 'null' && 
      config.userApiKey !== 'undefined' &&
      config.userApiKey.length > 10) { // API Key通常很长
    console.log('[getEffectiveApiKey] 使用用户API Key');
    return config.userApiKey.trim();
  }
  
  // 检查管理员API Key是否有效
  if (config.adminApiKey && 
      config.adminApiKey.trim() && 
      config.adminApiKey !== 'null' && 
      config.adminApiKey !== 'undefined' &&
      config.adminApiKey.length > 10) {
    console.log('[getEffectiveApiKey] 使用管理员API Key');
    return config.adminApiKey.trim();
  }
  
  console.log('[getEffectiveApiKey] 未找到有效的API Key');
  return null;
}

/**
 * 检查是否配置了 API Key
 */
export function hasApiKey(config: DeepSeekConfig): boolean {
  return getEffectiveApiKey(config) !== null;
}

/**
 * 获取友好的未配置提示信息
 */
export function getApiKeyMissingMessage(): string {
  return '未配置 DeepSeek API Key。\n\n您可以在以下位置配置：\n• 学员：系统设置 → DeepSeek AI 配置\n• 管理员：系统管理中心 → DeepSeek AI 配置\n\n获取 API Key：https://platform.deepseek.com/api_keys';
}

/**
 * 调用 DeepSeek API 生成内容
 */
export async function callDeepSeekAPI(params: {
  apiKey: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const {
    apiKey,
    prompt,
    systemPrompt = '你是一位专业的教育助手。',
    temperature = 0.7,
    maxTokens = 2000
  } = params;

  // 调试：打印API Key信息
  console.log('[DeepSeek API] 接收到的API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'null');
  console.log('[DeepSeek API] API Key类型:', typeof apiKey);
  console.log('[DeepSeek API] API Key长度:', apiKey?.length || 0);

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API 调用失败');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('[DeepSeek API Error]', error);
    throw new Error(`DeepSeek API 调用失败: ${error.message}`);
  }
}

/**
 * 生成题目深度解析
 */
export async function generateQuestionAnalysis(params: {
  apiKey: string;
  question: string;
  options: string[];
  answer: string | string[];
  explanation?: string;
}): Promise<string> {
  const { apiKey, question, options, answer, explanation } = params;
  
  const prompt = `作为金牌导师，请深度解析以下题目：

题目：${question}

选项：
${options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n')}

正确答案：${Array.isArray(answer) ? answer.join('、') : answer}

${explanation ? `参考解析：${explanation}` : ''}

请提供：
1. 题目考点分析
2. 解题思路和方法
3. 易错点提醒
4. 知识点扩展

请用 Markdown 格式输出，内容要详细且易懂。`;

  return callDeepSeekAPI({
    apiKey,
    prompt,
    systemPrompt: '你是一位经验丰富的教育专家，擅长深入浅出地讲解知识点。',
    temperature: 0.7,
    maxTokens: 2000
  });
}

/**
 * 生成实操评价
 */
export async function generatePracticalEvaluation(params: {
  apiKey: string;
  taskTitle: string;
  requirements: string;
  userAnswer: string;
  referenceAnswer: string;
}): Promise<{ score: number; content: string }> {
  const { apiKey, taskTitle, requirements, userAnswer, referenceAnswer } = params;
  
  const prompt = `实操题目：${taskTitle}

任务要求：
${requirements}

学生作答：
${userAnswer || '(未作答)'}

参考标准答案：
${referenceAnswer}

请作为严谨的实操导师，进行深度对比评价。你的回复必须是一个 JSON 对象，包含：
1. score: 匹配度评分 (0-100之间的整数)
2. content: 具体的改进建议 (Markdown 格式)

JSON 格式示例：
{
  "score": 85,
  "content": "## 评价总结\\n\\n您的答案...\\n\\n## 改进建议\\n\\n1. ..."
}`;

  const result = await callDeepSeekAPI({
    apiKey,
    prompt,
    systemPrompt: '你是一位严谨的实操导师，擅长评估学生的实践能力。请始终返回有效的 JSON 格式。',
    temperature: 0.5,
    maxTokens: 1500
  });

  try {
    // 尝试解析 JSON
    const parsed = JSON.parse(result);
    return {
      score: parsed.score || 0,
      content: parsed.content || '无法生成有效建议。'
    };
  } catch (e) {
    // 如果解析失败，尝试提取内容
    console.warn('[DeepSeek] Failed to parse JSON, using raw content');
    return {
      score: 0,
      content: result
    };
  }
}
