# 数据库连接池模块使用指南

## 概述

`db.js` 模块提供了一个完整的 PostgreSQL 数据库连接池解决方案，包括：
- 连接池管理
- 查询辅助函数
- 事务支持
- 错误处理和日志记录
- 优雅关闭

## 安装依赖

```bash
npm install pg dotenv
```

## 环境变量配置

在 `.env` 文件中配置数据库连接参数：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edumaster
DB_USER=edumaster_user
DB_PASSWORD=your_password_here
NODE_ENV=development
```

## 基本使用

### 1. 导入模块

```javascript
import db from './db.js';
// 或者按需导入
import { query, getOne, getMany, transaction } from './db.js';
```

### 2. 执行简单查询

```javascript
// 使用 query 方法
const result = await db.query('SELECT * FROM users WHERE role = $1', ['ADMIN']);
console.log(result.rows); // 返回所有行

// 使用 getOne 方法（获取单行）
const user = await db.getOne('SELECT * FROM users WHERE id = $1', ['user-123']);
console.log(user); // 返回单个对象或 null

// 使用 getMany 方法（获取多行）
const users = await db.getMany('SELECT * FROM users WHERE role = $1', ['STUDENT']);
console.log(users); // 返回数组
```

### 3. 执行插入/更新/删除操作

```javascript
// 插入数据
const insertResult = await db.execute(
  'INSERT INTO users (id, phone, password, role) VALUES ($1, $2, $3, $4)',
  ['user-123', '13800138000', 'hashed_password', 'STUDENT']
);
console.log('插入行数:', insertResult.rowCount);

// 更新数据
const updateResult = await db.execute(
  'UPDATE users SET nickname = $1 WHERE id = $2',
  ['新昵称', 'user-123']
);
console.log('更新行数:', updateResult.rowCount);

// 删除数据
const deleteResult = await db.execute(
  'DELETE FROM users WHERE id = $1',
  ['user-123']
);
console.log('删除行数:', deleteResult.rowCount);
```

### 4. 使用事务

```javascript
// 方式 1: 使用 transaction 辅助函数（推荐）
try {
  const result = await db.transaction(async (client) => {
    // 在事务中执行多个操作
    await client.query('INSERT INTO banks (id, name) VALUES ($1, $2)', ['bank-1', '题库1']);
    await client.query('INSERT INTO questions (id, bank_id, content) VALUES ($1, $2, $3)', 
      ['q-1', 'bank-1', '题目内容']);
    
    // 返回结果
    return { success: true, message: '批量操作成功' };
  });
  
  console.log(result); // { success: true, message: '批量操作成功' }
} catch (error) {
  console.error('事务失败，已回滚:', error);
}

// 方式 2: 手动管理事务
const client = await db.getClient();
try {
  await client.query('BEGIN');
  
  await client.query('INSERT INTO banks (id, name) VALUES ($1, $2)', ['bank-1', '题库1']);
  await client.query('INSERT INTO questions (id, bank_id, content) VALUES ($1, $2, $3)', 
    ['q-1', 'bank-1', '题目内容']);
  
  await client.query('COMMIT');
  console.log('事务提交成功');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('事务回滚:', error);
} finally {
  client.release();
}
```

### 5. 处理 JSONB 字段

```javascript
// 插入 JSONB 数据
await db.execute(
  'INSERT INTO questions (id, bank_id, options, answer) VALUES ($1, $2, $3, $4)',
  ['q-1', 'bank-1', JSON.stringify(['A', 'B', 'C']), JSON.stringify('A')]
);

// 查询 JSONB 数据
const question = await db.getOne('SELECT * FROM questions WHERE id = $1', ['q-1']);
console.log(question.options); // 自动解析为 JavaScript 对象

// 使用 JSONB 操作符查询
const questions = await db.getMany(
  "SELECT * FROM questions WHERE options @> $1",
  [JSON.stringify(['A'])]
);
```

### 6. 监控连接池状态

```javascript
// 获取连接池状态
const status = db.getPoolStatus();
console.log('连接池状态:', status);
// 输出: { totalCount: 5, idleCount: 3, waitingCount: 0 }
```

### 7. 优雅关闭

```javascript
// 应用关闭时关闭连接池
process.on('SIGINT', async () => {
  await db.closePool();
  process.exit(0);
});

// 或者手动关闭
await db.closePool();
```

## 高级用法

### 批量插入优化

```javascript
// 使用事务批量插入
await db.transaction(async (client) => {
  for (const question of questions) {
    await client.query(
      'INSERT INTO questions (id, bank_id, content, options, answer) VALUES ($1, $2, $3, $4, $5)',
      [question.id, question.bankId, question.content, 
       JSON.stringify(question.options), JSON.stringify(question.answer)]
    );
  }
});
```

### 分页查询

```javascript
async function getQuestionsPaginated(bankId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  
  // 获取总数
  const countResult = await db.getOne(
    'SELECT COUNT(*) as total FROM questions WHERE bank_id = $1',
    [bankId]
  );
  
  // 获取分页数据
  const questions = await db.getMany(
    'SELECT * FROM questions WHERE bank_id = $1 ORDER BY sort_order LIMIT $2 OFFSET $3',
    [bankId, pageSize, offset]
  );
  
  return {
    data: questions,
    total: parseInt(countResult.total),
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize)
  };
}
```

### 错误处理

```javascript
try {
  const user = await db.getOne('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 处理用户数据
} catch (error) {
  if (error.code === '23505') {
    // 唯一约束违反
    console.error('数据已存在');
  } else if (error.code === '23503') {
    // 外键约束违反
    console.error('关联数据不存在');
  } else {
    console.error('数据库错误:', error.message);
  }
}
```

## 常见 PostgreSQL 错误码

| 错误码 | 说明 |
|--------|------|
| 23505 | 唯一约束违反 |
| 23503 | 外键约束违反 |
| 23502 | 非空约束违反 |
| 23514 | 检查约束违反 |
| 42P01 | 表不存在 |
| 42703 | 列不存在 |

## 性能优化建议

1. **使用连接池**：已自动配置，无需额外操作
2. **使用参数化查询**：防止 SQL 注入，提升性能
3. **批量操作使用事务**：减少网络往返
4. **合理设置连接池大小**：根据服务器资源调整 `max` 参数
5. **使用索引**：为常用查询字段创建索引
6. **使用 JSONB 索引**：为 JSONB 字段创建 GIN 索引

## 测试

运行测试脚本验证连接池功能：

```bash
node test-db-pool.js
```

## 注意事项

1. **环境变量**：确保 `.env` 文件配置正确
2. **数据库连接**：确保 PostgreSQL 服务正在运行
3. **连接池大小**：根据实际并发需求调整 `max` 参数
4. **事务使用**：批量操作务必使用事务
5. **连接释放**：使用 `getClient()` 后务必调用 `client.release()`
6. **日志级别**：生产环境建议关闭详细日志或只记录慢查询

## 从 SQLite 迁移

### SQLite 语法 vs PostgreSQL 语法

| SQLite | PostgreSQL |
|--------|-----------|
| `?` 占位符 | `$1, $2, $3` 占位符 |
| `db.get()` | `db.getOne()` |
| `db.all()` | `db.getMany()` |
| `db.run()` | `db.execute()` |
| TEXT (JSON) | JSONB |
| INTEGER | INTEGER/BIGINT |
| REAL | NUMERIC |

### 迁移示例

**SQLite 代码：**
```javascript
db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, row) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(row);
});
```

**PostgreSQL 代码：**
```javascript
try {
  const user = await db.getOne('SELECT * FROM users WHERE phone = $1', [phone]);
  console.log(user);
} catch (error) {
  console.error(error);
}
```

## 支持

如有问题，请查看：
- PostgreSQL 官方文档：https://www.postgresql.org/docs/
- node-postgres 文档：https://node-postgres.com/
