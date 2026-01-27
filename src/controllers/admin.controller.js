/**
 * 管理员模块控制器
 */

import * as adminService from '../services/admin.service.js';

export async function getStudents(req, res) {
  try {
    const students = await adminService.getStudents();
    res.json(students);
  } catch (error) {
    console.error('[Admin] Get students error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAdmins(req, res) {
  try {
    const admins = await adminService.getAdmins();
    res.json(admins);
  } catch (error) {
    console.error('[Admin] Get admins error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getLoginLogs(req, res) {
  try {
    const { limit, offset } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    };
    
    const logs = await adminService.getLoginLogs(req.db, options);
    
    console.log(`[Admin] Retrieved ${logs.length} login logs`);
    res.json(logs);
  } catch (error) {
    console.error('[Admin] Get login logs error:', error);
    res.status(500).json({ 
      message: '获取登录日志失败',
      error: error.message 
    });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const { limit, offset, action, operatorId } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
      action,
      operatorId
    };
    
    const logs = await adminService.getAuditLogs(req.db, options);
    
    console.log(`[Admin] Retrieved ${logs.length} audit logs`);
    res.json(logs);
  } catch (error) {
    console.error('[Admin] Get audit logs error:', error);
    res.status(500).json({ 
      message: '获取审计日志失败',
      error: error.message 
    });
  }
}

export async function createAuditLog(req, res) {
  try {
    const { action, target } = req.body;
    
    // 验证必填字段
    if (!action) {
      return res.status(400).json({ message: '操作类型不能为空' });
    }
    
    // 从认证信息中获取操作者信息
    const logData = {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname || req.user?.phone,
      action,
      target
    };
    
    const result = await adminService.createAuditLog(req.db, logData);
    
    res.json(result);
  } catch (error) {
    console.error('[Admin] Create audit log error:', error);
    res.status(500).json({ 
      message: '创建审计日志失败',
      error: error.message 
    });
  }
}

export async function getAllAdmins(req, res) {
  try {
    const admins = await adminService.getAllAdmins(req.db);
    res.json(admins);
  } catch (error) {
    console.error('[Admin] Get all admins error:', error);
    res.status(500).json({ error: '获取管理员列表失败', message: error.message });
  }
}

export async function createAdmin(req, res) {
  try {
    const { phone, password, nickname, realName } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: '参数错误', message: '手机号和密码不能为空' });
    }
    
    const result = await adminService.createAdmin(req.db, {
      phone,
      password,
      nickname,
      realName
    });
    
    res.json(result);
  } catch (error) {
    console.error('[Admin] Create admin error:', error);
    res.status(500).json({ error: '创建管理员失败', message: error.message });
  }
}

export async function updateAdmin(req, res) {
  try {
    const { id } = req.params;
    const { nickname, realName, phone } = req.body;
    
    const result = await adminService.updateAdmin(req.db, id, {
      nickname,
      realName,
      phone
    });
    
    res.json(result);
  } catch (error) {
    console.error('[Admin] Update admin error:', error);
    res.status(500).json({ error: '更新管理员失败', message: error.message });
  }
}

export async function deleteAdmin(req, res) {
  try {
    const { id } = req.params;
    
    const result = await adminService.deleteAdmin(req.db, id);
    
    res.json(result);
  } catch (error) {
    console.error('[Admin] Delete admin error:', error);
    res.status(500).json({ error: '删除管理员失败', message: error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '参数错误', message: '旧密码和新密码不能为空' });
    }
    
    const result = await adminService.changeAdminPassword(
      req.db,
      req.user.id,
      oldPassword,
      newPassword
    );
    
    res.json(result);
  } catch (error) {
    console.error('[Admin] Change password error:', error);
    res.status(500).json({ error: '修改密码失败', message: error.message });
  }
}

export async function getExamHistory(req, res) {
  try {
    const history = await adminService.getAllExamHistory(req.db);
    res.json(history);
  } catch (error) {
    console.error('[Admin] Get exam history error:', error);
    res.status(500).json({ error: '获取考试历史失败', message: error.message });
  }
}

export async function getAllProgress(req, res) {
  try {
    const progress = await adminService.getAllProgress(req.db);
    res.json(progress);
  } catch (error) {
    console.error('[Admin] Get all progress error:', error);
    res.status(500).json({ error: '获取进度数据失败', message: error.message });
  }
}

export async function repairStudentSchema(req, res) {
  try {
    const result = await adminService.repairStudentSchema(req.db);
    res.json(result);
  } catch (error) {
    console.error('[Admin] Repair student schema error:', error);
    res.status(500).json({ error: '修复数据库失败', message: error.message });
  }
}
