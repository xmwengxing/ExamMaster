# 新API端点集成说明

## 概述

已完成后端API的开发，包括：
1. ✅ 填空题支持（题目创建、答案验证、部分得分计算）
2. ✅ 简答题支持（题目创建、答案保存、AI评分）
3. ✅ 标签系统（CRUD、关联、筛选、合并）
4. ✅ 讨论系统（CRUD、管理、题目关联）
5. ✅ 评论系统（CRUD、嵌套回复、级联删除）
6. ✅ 点赞系统（讨论点赞、评论点赞、幂等性）

## 文件说明

### 1. server-new-apis.js
包含所有新增的API端点代码，需要集成到 `server.js` 中。

### 2. utils/questionValidation.js
填空题答案验证的辅助函数，包括：
- `validateFillInBlankAnswers()` - 验证填空题答案并计算得分
- `checkBlankAnswer()` - 检查单个空白答案是否正确

## 集成步骤

### 步骤1：更新server.js中的题目相关端点

已完成的修改：
- ✅ `POST /api/questions` - 已支持填空题和简答题的验证
- ✅ `PUT /api/questions/:id` - 已支持新字段的更新和标签关联
- ✅ `GET /api/questions` - 已支持解析新字段（blanks, tags, aiGradingEnabled）

### 步骤2：添加新的API端点

将 `server-new-apis.js` 中的代码添加到 `server.js` 的 **404错误处理之前**：

```javascript
// 在这一行之前插入新的API端点
// 404 错误处理中间件 - 确保返回 JSON 而不是 HTML
app.use((req, res, next) => {
```

需要添加的API端点：

#### 标签系统 (8个端点)
- `GET /api/tags` - 获取所有标签
- `POST /api/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签
- `POST /api/tags/merge` - 合并标签
- `GET /api/questions/by-tags` - 按标签筛选题目
- `POST /api/questions/batch-tag` - 批量添加标签

#### AI评分 (1个端点)
- `POST /api/ai/grade-answer` - 简答题AI评分

#### 讨论系统 (8个端点)
- `GET /api/discussions` - 获取讨论列表
- `POST /api/discussions` - 创建讨论
- `GET /api/discussions/:id` - 获取讨论详情
- `PUT /api/discussions/:id` - 更新讨论
- `DELETE /api/discussions/:id` - 删除讨论
- `POST /api/discussions/:id/toggle-visibility` - 切换可见性
- `POST /api/discussions/:id/toggle-pin` - 切换置顶
- `GET /api/questions/:id/discussions` - 获取题目相关讨论

#### 评论系统 (3个端点)
- `GET /api/discussions/:id/comments` - 获取评论列表
- `POST /api/discussions/:id/comments` - 发表评论
- `DELETE /api/comments/:id` - 删除评论

#### 点赞系统 (2个端点)
- `POST /api/discussions/:id/like` - 点赞/取消点赞讨论
- `POST /api/comments/:id/like` - 点赞/取消点赞评论

### 步骤3：导入填空题验证函数

在 `server.js` 顶部添加导入：

```javascript
import { validateFillInBlankAnswers } from './utils/questionValidation.js';
```

### 步骤4：在练习和考试评分中使用填空题验证

在处理练习记录和考试提交时，需要使用 `validateFillInBlankAnswers` 函数来验证填空题答案。

示例代码：
```javascript
// 在评分逻辑中
if (question.type === 'FILL_IN_BLANK') {
  const result = validateFillInBlankAnswers(
    question.blanks, 
    userAnswers[question.id], 
    question.score || 1
  );
  score += result.score;
  if (result.correct < result.total) {
    wrongQuestions.push(question.id);
  }
}
```

## 测试建议

### 1. 填空题测试
```bash
# 创建填空题
curl -X POST http://localhost:3001/api/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bankId": "bank-123",
    "type": "FILL_IN_BLANK",
    "content": "JavaScript是一种{{blank1}}语言，常用于{{blank2}}开发。",
    "blanks": [
      {
        "id": "blank1",
        "position": 1,
        "acceptedAnswers": ["脚本", "编程", "动态"],
        "caseSensitive": false
      },
      {
        "id": "blank2",
        "position": 2,
        "acceptedAnswers": ["Web", "网页", "前端"],
        "caseSensitive": false
      }
    ],
    "explanation": "JavaScript是脚本语言，主要用于Web开发"
  }'
```

### 2. 简答题测试
```bash
# 创建简答题
curl -X POST http://localhost:3001/api/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bankId": "bank-123",
    "type": "SHORT_ANSWER",
    "content": "请简述JavaScript的闭包概念。",
    "referenceAnswer": "闭包是指函数可以访问其外部作用域的变量...",
    "aiGradingEnabled": true
  }'

# AI评分
curl -X POST http://localhost:3001/api/ai/grade-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q-123",
    "userAnswer": "闭包就是函数内部可以访问外部变量",
    "referenceAnswer": "闭包是指函数可以访问其外部作用域的变量..."
  }'
```

### 3. 标签系统测试
```bash
# 创建标签
curl -X POST http://localhost:3001/api/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "JavaScript", "color": "#f7df1e"}'

# 按标签筛选题目
curl -X GET "http://localhost:3001/api/questions/by-tags?tagIds=tag-1,tag-2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 讨论系统测试
```bash
# 创建讨论
curl -X POST http://localhost:3001/api/discussions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "关于闭包的疑问",
    "content": "我对闭包的理解还不够深入...",
    "questionId": "q-123"
  }'

# 发表评论
curl -X POST http://localhost:3001/api/discussions/disc-123/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "我也有同样的疑问"}'
```

## 注意事项

1. **数据库迁移**：数据库表和字段已在系统启动时自动创建（通过db.serialize()）

2. **权限控制**：
   - 标签管理：仅管理员
   - 讨论管理（隐藏/置顶/删除）：仅管理员
   - 讨论创建/评论：所有登录用户
   - 点赞：所有登录用户

3. **级联删除**：
   - 删除标签会检查是否有题目使用
   - 删除讨论会自动删除所有评论和点赞（数据库外键约束）
   - 删除评论会递归删除所有子评论

4. **性能优化**：
   - 已创建数据库索引提升查询性能
   - 讨论列表支持分页
   - 标签按使用次数排序

5. **错误处理**：
   - 所有API都包含完整的错误处理
   - 返回友好的错误信息
   - 使用HTTP标准状态码

## 下一步

完成API集成后，可以继续进行：
- ✅ 任务6：检查点 - 题型和标签功能
- 📝 任务10：检查点 - 讨论系统功能
- 📝 任务11-18：前端组件开发

## 联系方式

如有问题，请查看：
- 设计文档：`.kiro/specs/question-types-and-social-features/design.md`
- 需求文档：`.kiro/specs/question-types-and-social-features/requirements.md`
- 任务列表：`.kiro/specs/question-types-and-social-features/tasks.md`
