# DeepSeek API 迁移文档

**日期**: 2026-01-07  
**状态**: ✅ 已完成

## 概述

将项目中的 AI 功能从 Google Gemini API 迁移到 DeepSeek API，并添加了灵活的 API Key 配置系统。

## 迁移原因

1. **成本优化**: DeepSeek API 性价比更高
2. **响应速度**: DeepSeek API 响应更快
3. **灵活配置**: 支持管理员全局配置和学员个人配置

## 主要变更

### 1. API 替换

#### 移除的依赖
- `@google/genai` - Google Gemini SDK

#### 新增的工具
- `utils/deepseek.ts` - DeepSeek API 工具函数库

### 2. 功能映射

| 功能 | Gemini API | DeepSeek API | 状态 |
|------|-----------|--------------|------|
| 题目深度解析 | ✅ gemini-3-pro-preview | ✅ deepseek-chat | 已迁移 |
| 实操评价 | ✅ gemini-3-pro-preview | ✅ deepseek-chat | 已迁移 |
| 语音朗读 (TTS) | ✅ gemini-2.5-flash-preview-tts | ❌ 不支持 | 已禁用 |
| 网络搜索 | ✅ Google Search | ❌ 不支持 | 已移除 |

### 3. 配置系统

#### 管理员配置
- **位置**: 系统管理中心 → DeepSeek AI 配置
- **字段**: `deepseekApiKey`
- **作用**: 全局默认 API Key，供所有学员使用
- **存储**: `system_config` 表的 JSON 数据中

#### 学员配置
- **位置**: 系统设置 → DeepSeek AI 配置
- **字段**: `users.deepseekApiKey`
- **作用**: 个人专属 API Key，优先级高于管理员配置
- **存储**: `users` 表的 `deepseekApiKey` 字段

#### 优先级规则
```
学员个人 API Key > 管理员全局 API Key > 未配置（提示用户）
```

## 文件修改清单

### 前端文件

#### 新增文件
- ✅ `utils/deepseek.ts` - DeepSeek API 工具函数

#### 修改文件
- ✅ `pages/Student/PracticeMode.tsx` - 题目解析功能
- ✅ `pages/Student/PracticalPractice.tsx` - 实操评价功能
- ✅ `pages/Student/Exams.tsx` - 考试复盘解析功能
- ✅ `pages/Admin/SystemSettings.tsx` - 添加管理员 API 配置界面
- ✅ `pages/Student/AccountSettings.tsx` - 添加学员 API 配置界面
- ✅ `App.tsx` - 传递 API Key 更新函数
- ✅ `types.ts` - User 接口添加 `deepseekApiKey` 字段

### 后端文件

#### 修改文件
- ✅ `server.js`
  - 移除 GoogleGenAI 导入
  - 修改 `/api/ai/generate` 端点使用 DeepSeek API
  - 添加 `users.deepseekApiKey` 字段
  - 创建 `system_config_kv` 表（备用）
  - 实现 API Key 优先级逻辑

### 配置文件
- ✅ `.env.example` - 更新环境变量说明

### 文档文件
- ✅ `docs/DEEPSEEK_API_MIGRATION.md` - 本文档

## DeepSeek API 工具函数

### `getEffectiveApiKey(config)`
获取有效的 API Key，按优先级返回。

```typescript
const apiKey = getEffectiveApiKey({
  userApiKey: store.currentUser?.deepseekApiKey,
  adminApiKey: store.systemConfig?.deepseekApiKey
});
```

### `hasApiKey(config)`
检查是否配置了 API Key。

```typescript
if (!hasApiKey(config)) {
  alert(getApiKeyMissingMessage());
  return;
}
```

### `getApiKeyMissingMessage()`
返回友好的未配置提示信息。

### `callDeepSeekAPI(params)`
调用 DeepSeek API 生成内容。

```typescript
const result = await callDeepSeekAPI({
  apiKey,
  prompt: '你的问题',
  systemPrompt: '你是一位专业的教育助手。',
  temperature: 0.7,
  maxTokens: 2000
});
```

### `generateQuestionAnalysis(params)`
生成题目深度解析。

```typescript
const analysis = await generateQuestionAnalysis({
  apiKey,
  question: '题目内容',
  options: ['选项A', '选项B', '选项C', '选项D'],
  answer: 'A',
  explanation: '参考解析'
});
```

### `generatePracticalEvaluation(params)`
生成实操评价。

```typescript
const result = await generatePracticalEvaluation({
  apiKey,
  taskTitle: '实操题目',
  requirements: '任务要求',
  userAnswer: '学生作答',
  referenceAnswer: '参考答案'
});
// 返回: { score: 85, content: 'Markdown 格式的评价' }
```

## DeepSeek API 规范

### 端点
```
https://api.deepseek.com/v1/chat/completions
```

### 请求格式
```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "系统提示词" },
    { "role": "user", "content": "用户问题" }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### 响应格式
```json
{
  "choices": [
    {
      "message": {
        "content": "AI 生成的内容"
      }
    }
  ]
}
```

### 认证
```
Authorization: Bearer YOUR_API_KEY
```

## 配置指南

### 管理员配置步骤

1. 登录管理员账号（admin / admin）
2. 进入"系统管理中心"
3. 找到"DeepSeek AI 配置"部分
4. 点击"获取 API Key"链接，跳转到 https://platform.deepseek.com/api_keys
5. 注册/登录 DeepSeek 账号，创建 API Key
6. 复制 API Key 并粘贴到配置框中
7. 点击"保存所有配置"

### 学员配置步骤

1. 登录学员账号
2. 进入"系统设置"
3. 找到"DeepSeek AI 配置"部分
4. 点击"获取密钥"链接，跳转到 https://platform.deepseek.com/api_keys
5. 注册/登录 DeepSeek 账号，创建 API Key
6. 复制 API Key 并粘贴到配置框中
7. 点击"保存 API 配置"

## 功能说明

### 题目深度解析
- **触发位置**: 做题页面 → AI 深度解析按钮
- **功能**: 分析题目考点、解题思路、易错点、知识点扩展
- **模型**: deepseek-chat
- **参数**: temperature=0.7, max_tokens=2000

### 实操评价
- **触发位置**: 实操练习 → 提交后 → AI 智能评价按钮
- **功能**: 对比学生答案与标准答案，给出评分和改进建议
- **模型**: deepseek-chat
- **参数**: temperature=0.5, max_tokens=1500
- **返回**: JSON 格式 `{ score: number, content: string }`

### 语音朗读（已禁用）
- **状态**: DeepSeek 不支持 TTS 功能
- **提示**: 点击按钮会提示用户该功能暂不可用
- **未来**: 可考虑集成其他 TTS 服务（如 Azure TTS、阿里云 TTS）

## 错误处理

### API Key 未配置
```
未配置 DeepSeek API Key。

您可以在以下位置配置：
• 学员：系统设置 → DeepSeek AI 配置
• 管理员：系统管理中心 → DeepSeek AI 配置

获取 API Key：https://platform.deepseek.com/api_keys
```

### API 调用失败
```
DeepSeek API 调用失败: [错误信息]

请检查：
1. API Key 是否正确
2. 网络连接是否正常
3. DeepSeek 服务是否可用
```

## 数据库变更

### users 表
```sql
ALTER TABLE users ADD COLUMN deepseekApiKey TEXT;
```

### system_config_kv 表（新增）
```sql
CREATE TABLE IF NOT EXISTS system_config_kv (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## 测试清单

### 管理员配置测试
- [ ] 进入系统管理中心
- [ ] 配置 DeepSeek API Key
- [ ] 保存配置
- [ ] 刷新页面，验证配置已保存

### 学员配置测试
- [ ] 进入系统设置
- [ ] 配置个人 API Key
- [ ] 保存配置
- [ ] 刷新页面，验证配置已保存

### 题目解析测试
- [ ] 未配置 API Key 时，点击解析按钮应提示配置
- [ ] 配置管理员 API Key 后，解析功能正常
- [ ] 配置学员 API Key 后，优先使用学员配置
- [ ] 解析结果显示正确，格式美观

### 实操评价测试
- [ ] 未配置 API Key 时，点击评价按钮应提示配置
- [ ] 配置 API Key 后，评价功能正常
- [ ] 评分和建议显示正确
- [ ] 查看历史记录时不显示 AI 评价按钮

### 语音朗读测试
- [ ] 点击语音按钮应提示功能暂不可用
- [ ] 提示信息友好，说明原因

## 注意事项

1. **API Key 安全**
   - API Key 存储在数据库中，建议加密存储（当前为明文）
   - 不要在前端代码中硬编码 API Key
   - 定期更换 API Key

2. **成本控制**
   - DeepSeek API 按 token 计费
   - 建议设置合理的 max_tokens 限制
   - 监控 API 使用量

3. **错误处理**
   - 所有 API 调用都应有 try-catch
   - 提供友好的错误提示
   - 记录错误日志便于调试

4. **性能优化**
   - 避免频繁调用 API
   - 可考虑添加缓存机制
   - 设置合理的超时时间

## 后续优化建议

1. **TTS 功能恢复**
   - 集成第三方 TTS 服务（Azure TTS、阿里云 TTS）
   - 添加 TTS 配置选项

2. **API Key 加密**
   - 使用加密算法存储 API Key
   - 添加密钥管理功能

3. **使用统计**
   - 记录 API 调用次数
   - 显示使用量统计
   - 设置使用限额

4. **缓存机制**
   - 缓存常见题目的解析结果
   - 减少重复 API 调用
   - 提升响应速度

5. **多模型支持**
   - 支持切换不同的 AI 模型
   - 添加模型配置选项
   - 对比不同模型效果

## 相关链接

- [DeepSeek 官网](https://www.deepseek.com/)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [DeepSeek API Keys 管理](https://platform.deepseek.com/api_keys)
- [DeepSeek 定价](https://platform.deepseek.com/pricing)

## 技术支持

如遇到问题，请检查：
1. API Key 是否正确配置
2. 网络连接是否正常
3. DeepSeek 服务状态
4. 浏览器控制台错误信息
5. 服务器日志

---

**迁移完成日期**: 2026-01-07  
**维护者**: EduMaster 开发团队
