/**
 * 系统配置和监控模块控制器
 */

import * as systemService from '../services/system.service.js';

export async function getDatabaseMonitor(req, res) {
  try {
    const data = await systemService.getDatabaseMonitor();
    res.json(data);
  } catch (error) {
    console.error('[System] Database monitor error:', error);
    res.status(500).json({ error: '获取监控数据失败' });
  }
}

export async function getUserProgress(req, res) {
  try {
    const progress = await systemService.getUserProgress(req.user.id);
    res.json(progress);
  } catch (error) {
    console.error('[System] Get progress error:', error);
    res.status(500).send('获取进度失败');
  }
}

export async function getAllProgress(req, res) {
  try {
    const progress = await systemService.getAllProgress();
    res.json(progress);
  } catch (error) {
    console.error('[System] Get all progress error:', error);
    res.status(500).send('获取进度失败');
  }
}
