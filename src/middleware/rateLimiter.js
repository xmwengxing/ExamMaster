/**
 * Express 全局限速中间件
 * 纵深防御：Nginx 已做 IP 限速，Express 层作为第二道防线
 */
import rateLimit from 'express-rate-limit';

// 全局默认：每 IP 每 15 分钟 500 次
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: { error: '请求过于频繁，请稍后再试', retryAfter: '15分钟' }
});

// 登录接口：每 IP 每 15 分钟 10 次
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' }
});
