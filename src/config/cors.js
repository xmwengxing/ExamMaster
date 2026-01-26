// CORS 安全配置
import logger from '../../utils/logger.js';

// 根据环境配置允许的来源域名
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'https://exammaster.zzzjl.com',  // 生产域名
      'http://localhost:5173',          // 本地开发（Vite）
      'http://localhost:3000',          // 本地开发（备用）
    ];

// CORS 配置选项
export const corsOptions = {
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（如移动应用、Postman）
    if (!origin) {
      return callback(null, true);
    }
    
    // 检查来源是否在允许列表中
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS 请求被拒绝', {
        origin,
        allowedOrigins,
        ip: origin,
      });
      callback(new Error('不允许的 CORS 来源'));
    }
  },
  // 允许的 HTTP 方法
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // 允许的请求头
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  // 允许发送凭证（cookies）
  credentials: true,
  // 预检请求的缓存时间（秒）
  maxAge: 86400, // 24 小时
  // 暴露给客户端的响应头
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

// 导出允许的来源列表（用于测试或其他用途）
export { allowedOrigins };
