// 数据库中间件
// 将数据库实例注入到 req 对象中

import db from '../../db.js';

/**
 * 数据库中间件
 * 将数据库实例附加到 req.db，使所有路由处理函数都能访问数据库
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function injectDatabase(req, res, next) {
  req.db = db;
  next();
}

export default injectDatabase;
