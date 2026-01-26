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
    const logs = await adminService.getLoginLogs();
    res.json(logs);
  } catch (error) {
    console.error('[Admin] Get login logs error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const logs = await adminService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    console.error('[Admin] Get audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createAuditLog(req, res) {
  try {
    const result = await adminService.createAuditLog({
      ...req.body,
      userId: req.user.id
    });
    res.json(result);
  } catch (error) {
    console.error('[Admin] Create audit log error:', error);
    res.status(500).json({ error: error.message });
  }
}
