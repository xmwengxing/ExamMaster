# 测试指南

本目录包含项目的所有测试文件。

## 目录结构

```
tests/
├── setup.js              # 测试环境设置
├── helpers/              # 测试辅助工具
│   ├── mockDb.js        # 数据库 Mock 工具
│   └── testUtils.js     # 通用测试工具
├── unit/                 # 单元测试
│   ├── services/        # 服务层测试
│   └── utils/           # 工具函数测试
└── integration/          # 集成测试
```

## 运行测试

### 运行所有测试
```bash
npm test
```

### 监听模式（开发时使用）
```bash
npm run test:watch
```

### 生成覆盖率报告
```bash
npm run test:coverage
```

## 测试环境配置

### 环境变量

测试使用独立的环境变量配置（在 `tests/setup.js` 中设置）：

- `NODE_ENV=test`
- `JWT_SECRET=test-secret-key`
- `DB_NAME=edumaster_test`（测试数据库）

### 测试数据库

**重要**: 测试应该使用独立的测试数据库，避免影响开发或生产数据。

#### 方式 1: 使用 Docker（推荐）

```bash
# 启动测试数据库容器
docker run -d \
  --name edumaster-test-db \
  -e POSTGRES_DB=edumaster_test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  postgres:15

# 初始化数据库结构
docker exec -i edumaster-test-db psql -U postgres -d edumaster_test < postgres/init.sql
```

#### 方式 2: 使用本地 PostgreSQL

1. 创建测试数据库：
```sql
CREATE DATABASE edumaster_test;
```

2. 导入数据库结构：
```bash
psql -U postgres -d edumaster_test -f postgres/init.sql
```

## 编写测试

### 单元测试示例

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../../../src/services/auth.service.js';
import { createMockDb, createMockUser } from '../../helpers/mockDb.js';

// Mock 数据库模块
vi.mock('../../../db.js', () => ({
  default: createMockDb()
}));

describe('Auth Service', () => {
  let mockDb;
  
  beforeEach(() => {
    mockDb = createMockDb();
    vi.clearAllMocks();
  });
  
  describe('login', () => {
    it('应该在凭证正确时返回 token 和用户信息', async () => {
      const mockUser = createMockUser();
      mockDb.getOne.mockResolvedValue(mockUser);
      
      const result = await authService.login('13800138000', 'password123', 'STUDENT', '127.0.0.1');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
    });
  });
});
```

### 集成测试示例

```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('应该在凭证正确时返回 200 和 token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'password123',
          role: 'STUDENT'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });
});
```

## 测试辅助工具

### mockDb.js

提供数据库 Mock 和测试数据生成函数：

- `createMockDb()` - 创建数据库 mock 对象
- `createMockUser()` - 创建用户数据 mock
- `createMockBank()` - 创建题库数据 mock
- `createMockQuestion()` - 创建题目数据 mock
- `mockTransaction()` - Mock 数据库事务

### testUtils.js

提供通用测试工具函数：

- `generateTestToken()` - 生成测试 JWT token
- `generateAdminToken()` - 生成管理员 token
- `createMockRequest()` - 创建请求 mock
- `createMockResponse()` - 创建响应 mock
- `waitFor()` - 等待异步操作
- `assertStatusCode()` - 断言 HTTP 状态码

## 测试最佳实践

1. **隔离性**: 每个测试应该独立运行，不依赖其他测试
2. **可重复性**: 测试结果应该是确定的，多次运行结果一致
3. **清晰性**: 测试名称应该清楚描述测试内容
4. **完整性**: 测试应该覆盖正常流程、边界情况和错误情况
5. **速度**: 单元测试应该快速执行（< 100ms）

## 覆盖率目标

- 整体覆盖率: ≥ 70%
- 服务层覆盖率: ≥ 80%
- 工具函数覆盖率: ≥ 90%

## 常见问题

### Q: 测试运行很慢怎么办？

A: 
1. 使用 `vi.mock()` 模拟外部依赖
2. 避免在测试中使用真实的数据库操作
3. 使用 `--run` 参数运行一次性测试

### Q: 如何调试测试？

A:
1. 使用 `console.log()` 输出调试信息
2. 使用 `--reporter=verbose` 查看详细输出
3. 使用 VS Code 的调试功能

### Q: Mock 不生效怎么办？

A:
1. 确保 `vi.mock()` 在导入模块之前调用
2. 使用 `vi.clearAllMocks()` 清理 mock 状态
3. 检查 mock 路径是否正确
