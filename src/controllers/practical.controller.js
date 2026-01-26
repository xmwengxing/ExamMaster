/**
 * 实操模块控制器
 * 处理实操相关的 HTTP 请求
 */

import * as practicalService from '../services/practical.service.js';

/**
 * 获取所有实操任务
 */
export async function getPracticalTasks(req, res) {
  try {
    const tasks = await practicalService.getPracticalTasks();
    res.json(tasks);
  } catch (error) {
    console.error('[Practical Tasks] Get error:', error);
    res.status(500).send(error.message);
  }
}

/**
 * 创建实操任务（管理员）
 */
export async function createPracticalTask(req, res) {
  try {
    const result = await practicalService.createPracticalTask(req.body);
    console.log('[Practical Tasks] 创建成功:', result.id);
    res.json(result);
  } catch (error) {
    console.error('[Practical Tasks] Create error:', error);
    res.status(500).send(error.message);
  }
}

/**
 * 更新实操任务（管理员）
 */
export async function updatePracticalTask(req, res) {
  try {
    const result = await practicalService.updatePracticalTask(req.params.id, req.body);
    console.log('[Practical Tasks] 更新成功');
    res.json(result);
  } catch (error) {
    console.error('[Practical Tasks] Update error:', error);
    res.status(500).send(error.message);
  }
}

/**
 * 删除实操任务（管理员）
 */
export async function deletePracticalTask(req, res) {
  try {
    const result = await practicalService.deletePracticalTask(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('[Practical Tasks] Delete error:', error);
    res.status(500).send(error.message);
  }
}

/**
 * 获取实操记录
 */
export async function getPracticalRecords(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const records = await practicalService.getPracticalRecords(req.user.id, isAdmin);
    res.json(records);
  } catch (error) {
    console.error('[Practical Records] Get error:', error);
    res.status(500).send(error.message);
  }
}

/**
 * 创建实操记录
 */
export async function createPracticalRecord(req, res) {
  try {
    const recordData = {
      ...req.body,
      userId: req.body.userId || req.user.id
    };
    
    const result = await practicalService.createPracticalRecord(recordData);
    console.log('[Practical Records] 创建成功:', result.id);
    res.json(result);
  } catch (error) {
    console.error('[Practical Records] Create error:', error);
    res.status(500).send(error.message);
  }
}

/**
 * 删除实操记录
 */
export async function deletePracticalRecord(req, res) {
  try {
    const result = await practicalService.deletePracticalRecord(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[Practical Records] Delete error:', error);
    res.status(500).send(error.message);
  }
}
