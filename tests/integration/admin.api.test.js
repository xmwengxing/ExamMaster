/**
 * 管理员 API 集成测试
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server-new.js';
import db from '../../db.js';

describe('管理员 API 集成测试', () => {
  let adminToken;
  let studentToken;
  let testAdminId;

  beforeAll(async () => {
    // 创建测试管理员
    const adminPassword = await import('bcryptjs').then(m => m.default.hash('admin123', 10));
    testAdminId = `test-admin-${Date.now()}`;
    
    await db.execute(
      `INSERT INTO users (id, phone, password, nickname, role) 
       VALUES ($1, $2, $3, $4, 'ADMIN')`,
      [testAdminId, '13900000000', adminPassword, '测试管理员']
    );

    // 获取管理员token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ phone: '13900000000', password: 'admin123', role: 'ADMIN' });
    
    adminToken = adminLoginRes.body.token;
    console.log('[Test] Admin token:', adminToken ? `${adminToken.substring(0, 20)}...` : 'undefined');

    // 创建测试学生
    const studentPassword = await import('bcryptjs').then(m => m.default.hash('student123', 10));
    const testStudentId = `test-student-${Date.now()}`;
    
    await db.execute(
      `INSERT INTO users (id, phone, password, nickname, role) 
       VALUES ($1, $2, $3, $4, 'STUDENT')`,
      [testStudentId, '13900000001', studentPassword, '测试学生']
    );

    // 获取学生token
    const studentLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ phone: '13900000001', password: 'student123', role: 'STUDENT' });
    
    studentToken = studentLoginRes.body.token;
    console.log('[Test] Student token:', studentToken ? `${studentToken.substring(0, 20)}...` : 'undefined');
  });

  afterAll(async () => {
    // 清理测试数据
    await db.execute("DELETE FROM users WHERE phone LIKE '139000000%'");
  });

  describe('管理员账号管理', () => {
    let createdAdminId;

    describe('GET /api/admin/admins - 获取管理员列表', () => {
      it('应该返回管理员列表', async () => {
        const res = await request(app)
          .get('/api/admin/admins')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        
        // 验证返回的数据结构
        const admin = res.body[0];
        expect(admin).toHaveProperty('id');
        expect(admin).toHaveProperty('phone');
        expect(admin).toHaveProperty('nickname');
        expect(admin).not.toHaveProperty('password'); // 不应该返回密码
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .get('/api/admin/admins')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });

      it('应该拒绝未认证访问', async () => {
        const res = await request(app)
          .get('/api/admin/admins');

        expect(res.status).toBe(401);
      });
    });

    describe('POST /api/admin/admins - 创建管理员', () => {
      it('应该成功创建新管理员', async () => {
        const newAdmin = {
          phone: '13900000010',
          password: 'newadmin123',
          nickname: '新管理员',
          realName: '张三'
        };

        const res = await request(app)
          .post('/api/admin/admins')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newAdmin);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBeDefined();
        
        createdAdminId = res.body.id;

        // 验证管理员已创建
        const checkRes = await request(app)
          .get('/api/admin/admins')
          .set('Authorization', `Bearer ${adminToken}`);
        
        const created = checkRes.body.find(a => a.id === createdAdminId);
        expect(created).toBeDefined();
        expect(created.phone).toBe('13900000010');
        expect(created.nickname).toBe('新管理员');
      });

      it('应该拒绝重复的手机号', async () => {
        const duplicateAdmin = {
          phone: '13900000010', // 已存在
          password: 'password123',
          nickname: '重复管理员'
        };

        const res = await request(app)
          .post('/api/admin/admins')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(duplicateAdmin);

        expect(res.status).toBe(500);
        expect(res.body.message).toContain('手机号已存在');
      });

      it('应该拒绝缺少必填字段', async () => {
        const invalidAdmin = {
          phone: '13900000011'
          // 缺少 password
        };

        const res = await request(app)
          .post('/api/admin/admins')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidAdmin);

        expect(res.status).toBe(400);
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .post('/api/admin/admins')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ phone: '13900000012', password: 'test123' });

        expect(res.status).toBe(403);
      });
    });

    describe('PUT /api/admin/admins/:id - 更新管理员', () => {
      it('应该成功更新管理员信息', async () => {
        const updates = {
          nickname: '更新后的昵称',
          realName: '李四'
        };

        const res = await request(app)
          .put(`/api/admin/admins/${createdAdminId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // 验证更新成功
        const checkRes = await request(app)
          .get('/api/admin/admins')
          .set('Authorization', `Bearer ${adminToken}`);
        
        const updated = checkRes.body.find(a => a.id === createdAdminId);
        expect(updated.nickname).toBe('更新后的昵称');
        expect(updated.realName).toBe('李四');
      });

      it('应该拒绝更新不存在的管理员', async () => {
        const res = await request(app)
          .put('/api/admin/admins/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ nickname: '测试' });

        expect(res.status).toBe(500);
        expect(res.body.message).toContain('管理员不存在');
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .put(`/api/admin/admins/${createdAdminId}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ nickname: '测试' });

        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/admin/change-password - 修改密码', () => {
      it('应该成功修改密码', async () => {
        const res = await request(app)
          .post('/api/admin/change-password')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            oldPassword: 'admin123',
            newPassword: 'newadmin456'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // 验证新密码可以登录
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ phone: '13900000000', password: 'newadmin456', role: 'ADMIN' });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();

        // 恢复原密码以便后续测试
        await request(app)
          .post('/api/admin/change-password')
          .set('Authorization', `Bearer ${loginRes.body.token}`)
          .send({
            oldPassword: 'newadmin456',
            newPassword: 'admin123'
          });
      });

      it('应该拒绝错误的旧密码', async () => {
        const res = await request(app)
          .post('/api/admin/change-password')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            oldPassword: 'wrongpassword',
            newPassword: 'newpassword123'
          });

        expect(res.status).toBe(500);
        expect(res.body.message).toContain('旧密码错误');
      });

      it('应该拒绝缺少必填字段', async () => {
        const res = await request(app)
          .post('/api/admin/change-password')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            oldPassword: 'admin123'
            // 缺少 newPassword
          });

        expect(res.status).toBe(400);
      });
    });

    describe('DELETE /api/admin/admins/:id - 删除管理员', () => {
      it('应该成功删除管理员', async () => {
        const res = await request(app)
          .delete(`/api/admin/admins/${createdAdminId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // 验证管理员已删除
        const checkRes = await request(app)
          .get('/api/admin/admins')
          .set('Authorization', `Bearer ${adminToken}`);
        
        const deleted = checkRes.body.find(a => a.id === createdAdminId);
        expect(deleted).toBeUndefined();
      });

      it('应该拒绝删除不存在的管理员', async () => {
        const res = await request(app)
          .delete('/api/admin/admins/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body.message).toContain('管理员不存在');
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .delete(`/api/admin/admins/${testAdminId}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });
    });
  });

  describe('考试历史和进度管理', () => {
    describe('GET /api/admin/exam-history - 获取考试历史', () => {
      it('应该返回所有考试历史', async () => {
        const res = await request(app)
          .get('/api/admin/exam-history')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // 验证返回的数据结构(如果有数据)
        if (res.body.length > 0) {
          const history = res.body[0];
          expect(history).toHaveProperty('id');
          expect(history).toHaveProperty('userId');
          expect(history).toHaveProperty('bankId');
          expect(history).toHaveProperty('score');
          expect(history).toHaveProperty('user');
          expect(history.user).toHaveProperty('phone');
        }
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .get('/api/admin/exam-history')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('GET /api/admin/all-progress - 获取所有进度', () => {
      it('应该返回所有进度数据', async () => {
        const res = await request(app)
          .get('/api/admin/all-progress')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // 验证返回的数据结构(如果有数据)
        if (res.body.length > 0) {
          const progress = res.body[0];
          expect(progress).toHaveProperty('id');
          expect(progress).toHaveProperty('userId');
          expect(progress).toHaveProperty('date');
          expect(progress).toHaveProperty('count');
          expect(progress).toHaveProperty('user');
        }
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .get('/api/admin/all-progress')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });
    });
  });

  describe('数据库修复', () => {
    describe('POST /api/admin/repair-student-schema - 修复学生权限', () => {
      it('应该成功执行修复', async () => {
        const res = await request(app)
          .post('/api/admin/repair-student-schema')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('fixed');
        expect(typeof res.body.fixed).toBe('number');
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .post('/api/admin/repair-student-schema')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });
    });
  });

  describe('日志管理', () => {
    describe('GET /api/admin/login-logs - 获取登录日志', () => {
      it('应该返回登录日志列表', async () => {
        const res = await request(app)
          .get('/api/admin/login-logs')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // 验证返回的数据结构(如果有数据)
        if (res.body.length > 0) {
          const log = res.body[0];
          expect(log).toHaveProperty('id');
          expect(log).toHaveProperty('userId');
          expect(log).toHaveProperty('phone');
          expect(log).toHaveProperty('role');
          expect(log).toHaveProperty('time');
        }
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .get('/api/admin/login-logs')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('GET /api/admin/audit-logs - 获取审计日志', () => {
      it('应该返回审计日志列表', async () => {
        const res = await request(app)
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // 验证返回的数据结构(如果有数据)
        if (res.body.length > 0) {
          const log = res.body[0];
          expect(log).toHaveProperty('id');
          expect(log).toHaveProperty('action');
          expect(log).toHaveProperty('timestamp');
        }
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/admin/audit-logs - 创建审计日志', () => {
      it('应该成功创建审计日志', async () => {
        const logData = {
          action: '测试操作',
          target: 'test-target'
        };

        const res = await request(app)
          .post('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(logData);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBeDefined();
      });

      it('应该拒绝缺少操作类型', async () => {
        const logData = {
          target: 'test-target'
        };

        const res = await request(app)
          .post('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(logData);

        expect(res.status).toBe(400);
      });

      it('应该拒绝非管理员访问', async () => {
        const res = await request(app)
          .post('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ action: '测试操作' });

        expect(res.status).toBe(403);
      });
    });
  });
});
