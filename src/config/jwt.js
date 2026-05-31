// JWT 配置

// JWT 密钥（必须从环境变量读取，不允许 fallback）
const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Set it before starting the server.');
}
export const JWT_SECRET = _jwtSecret;

// JWT 过期时间
export const JWT_EXPIRES_IN = '7d'; // 7天

// JWT 配置对象（用于 jsonwebtoken 库）
export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
};

/**
 * 生成 JWT 配置选项
 * @param {Object} options - 自定义选项
 * @returns {Object} JWT 签名选项
 */
export function getJwtSignOptions(options = {}) {
  return {
    expiresIn: options.expiresIn || JWT_EXPIRES_IN,
    ...options,
  };
}

/**
 * 生成 JWT 验证选项
 * @param {Object} options - 自定义选项
 * @returns {Object} JWT 验证选项
 */
export function getJwtVerifyOptions(options = {}) {
  return {
    ...options,
  };
}
