/**
 * EduMaster 服务器主入口文件（模块化版本）
 * 
 * 本文件只包含应用初始化和启动逻辑
 * 所有业务逻辑已模块化到 src/ 目录
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// 导入配置
import { corsOptions } from './src/config/cors.js';

// 导入中间件
import { requestLogger, errorLogger } from './utils/logger.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { injectDatabase } from './src/middleware/database.js';

// 导入路由聚合器
import { registerRoutes } from './src/routes/index.js';

// 导入日志模块
import logger from './utils/logger.js';

// 导入数据库模块
import db from './db.js';

// 创建 Express 应用
const app = express();
const port = process.env.PORT || 3001;

// ========== 中间件配置 ==========

// CORS 配置
app.use(cors(corsOptions));

// JSON 解析（限制 100MB，支持大量图片的题库导入）
app.use(express.json({ limit: '100mb' }));

// 数据库中间件（必须在路由之前）
app.use(injectDatabase);

// 请求日志中间件
app.use(requestLogger);

// ========== 路由注册 ==========

// 注册所有模块化路由
registerRoutes(app);

// ========== 错误处理 ==========

// 404 错误处理
app.use((req, res, next) => {
  res.status(404).json({
    error: '请求的资源不存在',
    code: 'NOT_FOUND',
    details: {
      method: req.method,
      path: req.path
    }
  });
});

// 全局错误处理中间件
app.use(errorHandler);

// 错误日志中间件
app.use(errorLogger);

// ========== 服务器启动 ==========

// 只在非测试环境下启动服务器
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info('服务器启动成功', {
      port,
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      database: 'PostgreSQL',
      poolStatus: db.getPoolStatus()
    });
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎓 EduMaster 全栈刷题系统                                ║
║                                                            ║
║   服务器已启动: http://localhost:${port}                    ║
║   环境: ${process.env.NODE_ENV || 'development'}                                      ║
║   数据库: PostgreSQL (已连接)                              ║
║                                                            ║
║   模块化架构 ✅                                            ║
║   - 配置模块、工具函数、中间件                             ║
║   - 认证、用户、题库、题目                                 ║
║   - 练习、考试、实操、讨论                                 ║
║   - AI、标签、管理员、系统监控                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，开始优雅关闭');
  db.closePool();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，开始优雅关闭');
  db.closePool();
  process.exit(0);
});

// 导出 app 供测试使用
export default app;
