# src/ 目录说明

本目录包含模块化后的服务器代码。

## 目录结构

```
src/
├── config/          # 配置文件
│   ├── cors.js      # CORS 配置
│   ├── jwt.js       # JWT 配置
│   ├── constants.js # 常量定义
│   └── index.js     # 配置入口
│
├── middleware/      # 中间件
│   ├── auth.js      # 认证中间件
│   ├── errorHandler.js  # 错误处理中间件
│   └── requestLogger.js # 请求日志中间件
│
├── routes/          # 路由定义
│   ├── index.js     # 路由聚合器
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── bank.routes.js
│   ├── question.routes.js
│   ├── practice.routes.js
│   ├── exam.routes.js
│   ├── practical.routes.js
│   ├── discussion.routes.js
│   ├── ai.routes.js
│   ├── admin.routes.js
│   ├── tag.routes.js
│   └── system.routes.js
│
├── controllers/     # 控制器（业务逻辑协调层）
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── bank.controller.js
│   ├── question.controller.js
│   ├── practice.controller.js
│   ├── exam.controller.js
│   ├── practical.controller.js
│   ├── discussion.controller.js
│   ├── ai.controller.js
│   ├── admin.controller.js
│   ├── tag.controller.js
│   └── system.controller.js
│
├── services/        # 服务层（业务逻辑实现层）
│   ├── auth.service.js
│   ├── user.service.js
│   ├── bank.service.js
│   ├── question.service.js
│   ├── practice.service.js
│   ├── exam.service.js
│   ├── practical.service.js
│   ├── discussion.service.js
│   ├── ai.service.js
│   ├── admin.service.js
│   ├── tag.service.js
│   └── srs.service.js
│
└── utils/           # 工具函数
    ├── parsers.js   # 数据解析工具
    ├── validators.js # 数据验证工具
    └── helpers.js   # 辅助函数
```

## 架构说明

### 分层架构

1. **Routes（路由层）**: 定义 API 端点，将请求分发到对应的控制器
2. **Controllers（控制器层）**: 协调业务逻辑，处理请求和响应
3. **Services（服务层）**: 实现核心业务逻辑和数据库操作
4. **Utils（工具层）**: 提供可复用的工具函数

### 模块划分原则

- **单一职责**: 每个模块只负责一个功能域
- **低耦合**: 模块之间通过接口通信，减少依赖
- **高内聚**: 相关功能组织在同一模块内

## 使用指南

### 添加新功能

1. 在 `services/` 中创建服务文件，实现业务逻辑
2. 在 `controllers/` 中创建控制器文件，协调服务调用
3. 在 `routes/` 中创建路由文件，定义 API 端点
4. 在 `routes/index.js` 中注册新路由

### 代码规范

- 使用 ES6+ 模块语法（import/export）
- 函数命名使用 camelCase
- 文件命名使用 kebab-case 或 camelCase
- 添加适当的注释和文档
- 遵循 ESLint 规则

## 测试

测试文件位于 `tests/` 目录：
- `tests/unit/` - 单元测试
- `tests/integration/` - 集成测试

运行测试：
```bash
npm test
```
