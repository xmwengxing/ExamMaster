// 认证服务单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  login,
  changePassword,
  updateLastActivity,
  verifyToken,
  generateToken,
  refreshToken
} from '../../../src/services/auth.service.js';
import { 
  UnauthorizedError, 
  ValidationError, 
  NotFoundError 
} from '../../../src/middleware/errorHandler.js';

// Mock 数据库
vi.mock('../../../db.js', () => ({
  default: {
    getOne: vi.fn(),
    execute: vi.fn()
  }
}));

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

import db from '../../../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('认证服务单元测试', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('login 函数', () => {
    const mockUser = {
      id: 1,
      phone: '13800138000',
      password: bcrypt.hashSync('password123', 10),
      role: 'student',
      nickname: '测试用户',
      login_history: [],
      student_perms: [],
      allowed_bank_ids: [],
      real_name: '张三',
      last_activity: null,
      deepseek_api_key: null
    };
    
    it('应该成功登录并返回 token 和用户信息', async () => {
      db.getOne.mockResolvedValue(mockUser);
      db.execute.mockResolvedValue({});
      
      const result = await login('13800138000', 'password123', 'student', '127.0.0.1');
      
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.id).toBe(1);
      expect(result.user.phone).toBe('13800138000');
      
      // 验证数据库调用
      expect(db.getOne).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE phone = $1 AND role = $2',
        ['13800138000', 'student']
      );
      
      // 验证更新了登录信息
      expect(db.execute).toHaveBeenCalledTimes(2); // 更新用户 + 插入日志
    });
    
    it('应该在用户不存在时抛出错误', async () => {
      db.getOne.mockResolvedValue(null);
      
      await expect(
        login('13800138000', 'password123', 'student')
      ).rejects.toThrow(UnauthorizedError);
    });
    
    it('应该在密码错误时抛出错误', async () => {
      db.getOne.mockResolvedValue(mockUser);
      
      await expect(
        login('13800138000', 'wrongpassword', 'student')
      ).rejects.toThrow(UnauthorizedError);
    });
    
    it('应该在缺少参数时抛出验证错误', async () => {
      await expect(
        login('', 'password123', 'student')
      ).rejects.toThrow(ValidationError);
      
      await expect(
        login('13800138000', '', 'student')
      ).rejects.toThrow(ValidationError);
      
      await expect(
        login('13800138000', 'password123', '')
      ).rejects.toThrow(ValidationError);
    });
    
    it('应该正确处理登录历史', async () => {
      const userWithHistory = {
        ...mockUser,
        login_history: Array(99).fill('2024-01-01 12:00:00')
      };
      
      db.getOne.mockResolvedValue(userWithHistory);
      db.execute.mockResolvedValue({});
      
      await login('13800138000', 'password123', 'student');
      
      // 验证登录历史被更新（应该保留最近100条）
      const updateCall = db.execute.mock.calls.find(call => 
        call[0].includes('UPDATE users')
      );
      
      expect(updateCall).toBeDefined();
      const loginHistoryParam = updateCall[1][1];
      const history = JSON.parse(loginHistoryParam);
      expect(history.length).toBe(100); // 99 + 1 = 100
    });
    
    it('应该转换字段名为 camelCase', async () => {
      db.getOne.mockResolvedValue(mockUser);
      db.execute.mockResolvedValue({});
      
      const result = await login('13800138000', 'password123', 'student');
      
      expect(result.user).toHaveProperty('realName');
      expect(result.user).toHaveProperty('studentPerms');
      expect(result.user).toHaveProperty('allowedBankIds');
      expect(result.user).toHaveProperty('lastActivity');
      expect(result.user).toHaveProperty('deepseekApiKey');
    });
  });
  
  describe('changePassword 函数', () => {
    const mockUser = {
      id: 1,
      password: bcrypt.hashSync('oldpassword', 10)
    };
    
    it('应该成功修改密码', async () => {
      db.getOne.mockResolvedValue(mockUser);
      db.execute.mockResolvedValue({});
      
      await changePassword(1, 'oldpassword', 'newpassword');
      
      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE users SET password = $1 WHERE id = $2',
        [expect.any(String), 1]
      );
      
      // 验证新密码被加密
      const newHash = db.execute.mock.calls[0][1][0];
      expect(bcrypt.compareSync('newpassword', newHash)).toBe(true);
    });
    
    it('应该在旧密码错误时抛出错误', async () => {
      db.getOne.mockResolvedValue(mockUser);
      
      await expect(
        changePassword(1, 'wrongpassword', 'newpassword')
      ).rejects.toThrow(UnauthorizedError);
    });
    
    it('应该在用户不存在时抛出错误', async () => {
      db.getOne.mockResolvedValue(null);
      
      await expect(
        changePassword(1, 'oldpassword', 'newpassword')
      ).rejects.toThrow(NotFoundError);
    });
    
    it('应该在新密码太短时抛出验证错误', async () => {
      db.getOne.mockResolvedValue(mockUser);
      
      await expect(
        changePassword(1, 'oldpassword', '123')
      ).rejects.toThrow(ValidationError);
    });
    
    it('应该在缺少参数时抛出验证错误', async () => {
      await expect(
        changePassword(1, '', 'newpassword')
      ).rejects.toThrow(ValidationError);
      
      await expect(
        changePassword(1, 'oldpassword', '')
      ).rejects.toThrow(ValidationError);
    });
  });
  
  describe('updateLastActivity 函数', () => {
    it('应该更新用户最后活动时间', async () => {
      db.execute.mockResolvedValue({});
      
      const result = await updateLastActivity(1);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 格式
      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE users SET last_activity = $1 WHERE id = $2',
        [expect.any(String), 1]
      );
    });
  });
  
  describe('verifyToken 函数', () => {
    it('应该验证有效的 token', () => {
      const payload = { id: 1, role: 'student' };
      const token = jwt.sign(payload, JWT_SECRET);
      
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(1);
      expect(decoded.role).toBe('student');
    });
    
    it('应该在 token 无效时抛出错误', () => {
      expect(() => verifyToken('invalid-token')).toThrow(UnauthorizedError);
    });
    
    it('应该在 token 过期时抛出错误', () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1h' });
      
      expect(() => verifyToken(token)).toThrow(UnauthorizedError);
    });
  });
  
  describe('generateToken 函数', () => {
    it('应该生成有效的 token', () => {
      const payload = { id: 1, role: 'student' };
      const token = generateToken(payload);
      
      expect(token).toBeTruthy();
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(1);
      expect(decoded.role).toBe('student');
    });
    
    it('应该支持自定义过期时间', () => {
      const payload = { id: 1 };
      const token = generateToken(payload, '1h');
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.exp).toBeDefined();
    });
  });
  
  describe('refreshToken 函数', () => {
    it('应该刷新有效的 token', () => {
      const payload = { id: 1, role: 'student' };
      const oldToken = jwt.sign(payload, JWT_SECRET);
      
      const newToken = refreshToken(oldToken);
      
      expect(newToken).toBeTruthy();
      expect(newToken).not.toBe(oldToken);
      
      const decoded = jwt.verify(newToken, JWT_SECRET);
      expect(decoded.id).toBe(1);
      expect(decoded.role).toBe('student');
    });
    
    it('应该在 token 无效时抛出错误', () => {
      expect(() => refreshToken('invalid-token')).toThrow(UnauthorizedError);
    });
  });
  
});
