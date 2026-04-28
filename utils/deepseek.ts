/**
 * AI API 工具函数
 * 统一通过后端 /api/ai/generate 调用，支持多种 AI 服务商
 */

/**
 * 调用后端 AI API 生成内容
 */
async function callBackendAI(params: {
  prompt: string;
  systemPrompt?: string;
}): Promise<string> {
  const token = localStorage.getItem('edu_token');
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: params.systemPrompt ? `${params.systemPrompt}\n\n${params.prompt}` : params.prompt })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI API 调用失败');
  }

  const data = await response.json();
  return data.text || '';
}

export function getEffectiveApiKey(config: any): string | null {
  // 兼容旧调用，实际 key 由后端管理
  return config?.userApiKey || config?.adminApiKey || 'backend';
}

export function hasApiKey(config: any): boolean {
  return true; // 由后端判断是否配置了 key
}

export function getApiKeyMissingMessage(): string {
  return '未配置 AI API Key，请联系管理员在系统设置中配置。';
}

export async function callDeepSeekAPI(params: {
  apiKey: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  try {
    return await callBackendAI({ prompt: params.prompt, systemPrompt: params.systemPrompt });
  } catch (error: any) {
    console.error('[AI API Error]', error);
    throw new Error(`AI API 调用失败: ${error.message}`);
  }
}

export async function generateQuestionAnalysis(params: {
  apiKey: string;
  question: string;
  options: string[];
  answer: string | string[];
  explanation?: string;
}): Promise<string> {
  const { question, options, answer, explanation } = params;

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

  return callBackendAI({
    prompt,
    systemPrompt: '你是一位经验丰富的教育专家，擅长深入浅出地讲解知识点。'
  });
}

export async function generatePracticalEvaluation(params: {
  apiKey: string;
  taskTitle: string;
  requirements: string;
  userAnswer: string;
  referenceAnswer: string;
}): Promise<{ score: number; content: string }> {
  const { taskTitle, requirements, userAnswer, referenceAnswer } = params;

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

  const result = await callBackendAI({
    prompt,
    systemPrompt: '你是一位严谨的实操导师，擅长评估学生的实践能力。请始终返回有效的 JSON 格式。'
  });

  try {
    const parsed = JSON.parse(result);
    return { score: parsed.score || 0, content: parsed.content || '无法生成有效建议。' };
  } catch (e) {
    return { score: 0, content: result };
  }
}
