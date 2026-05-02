/**
 * 管理员模块控制器
 */

import * as adminService from '../services/admin.service.js';

export async function getStudents(req, res) {
  try {
    const { page, pageSize } = req.query;
    const students = await adminService.getStudents({ page, pageSize });
    res.json(students);
  } catch (error) {
    console.error('[Admin] Get students error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createStudent(req, res) {
  try {
    const studentData = req.body;
    const result = await adminService.createStudent(req.db, studentData);
    res.json(result);
  } catch (error) {
    console.error('[Admin] Create student error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await adminService.updateStudent(req.db, id, updates);
    res.json(result);
  } catch (error) {
    console.error('[Admin] Update student error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    const result = await adminService.deleteStudent(req.db, id);
    res.json(result);
  } catch (error) {
    console.error('[Admin] Delete student error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function batchDeleteStudents(req, res) {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供要删除的学员ID列表' });
    }
    
    const result = await adminService.batchDeleteStudents(req.db, ids);
    res.json(result);
  } catch (error) {
    console.error('[Admin] Batch delete students error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAdmins(req, res) {
  try {
    const admins = await adminService.getAdmins();
    console.log('[Admin Controller] 返回管理员列表:', admins.length, '个');
    admins.forEach((admin, index) => {
      console.log(`[Admin Controller] 管理员 ${index + 1}:`, {
        id: admin.id,
        phone: admin.phone,
        permissions: admin.permissions
      });
    });
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
    const { phone, password, nickname, realName, permissions } = req.body;
    
    console.log('[Admin Controller] 创建管理员请求:', { phone, nickname, realName, permissions });
    
    if (!phone || !password) {
      return res.status(400).json({ error: '参数错误', message: '手机号和密码不能为空' });
    }
    
    const result = await adminService.createAdmin(req.db, {
      phone,
      password,
      nickname,
      realName,
      permissions
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
    const { nickname, realName, phone, permissions } = req.body;
    
    console.log('[Admin Controller] 更新管理员请求:', { id, nickname, realName, phone, permissions });
    
    const result = await adminService.updateAdmin(req.db, id, {
      nickname,
      realName,
      phone,
      permissions
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
    const { page, pageSize } = req.query;
    const history = await adminService.getAllExamHistory(req.db, { page, pageSize });
    res.json(history);
  } catch (error) {
    console.error('[Admin] Get exam history error:', error);
    res.status(500).json({ error: '获取考试历史失败', message: error.message });
  }
}

export async function getAllProgress(req, res) {
  try {
    const { page, pageSize } = req.query;
    const progress = await adminService.getAllProgress(req.db, { page, pageSize });
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

/**
 * 批量设置学员权限
 */
export async function batchSetStudentPerms(req, res) {
  console.log('[Admin] Batch set student perms:', { 
    count: Object.keys(req.body || {}).length,
    user: req.user && { id: req.user.id, role: req.user.role } 
  });
  
  try {
    const data = req.body || {};
    const result = await adminService.batchSetStudentPerms(req.db, data);
    res.json(result);
  } catch (error) {
    console.error('[Admin] Batch set student perms error:', error);
    res.status(500).json({ error: '批量设置权限失败', message: error.message });
  }
}

/**
 * 设置学员分组
 */
export async function setStudentGroup(req, res) {
  try {
    const { studentId } = req.params;
    const { groupId } = req.body;
    const { setStudentGroup } = await import('../services/groups.service.js');
    const result = await setStudentGroup(req.db, studentId, groupId);
    res.json(result);
  } catch (error) {
    console.error('[Admin] Set student group error:', error);
    res.status(500).json({ error: '设置分组失败', message: error.message });
  }
}

/**
 * 获取学员练习统计
 */
export async function getStudentPracticeStats(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: '参数错误', message: '学员ID不能为空' });
    }
    
    const stats = await adminService.getStudentPracticeStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('[Admin] Get student practice stats error:', error);
    res.status(500).json({ error: '获取练习统计失败', message: error.message });
  }
}
