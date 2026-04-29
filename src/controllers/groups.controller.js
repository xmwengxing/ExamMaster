// 分组管理控制器

import * as groupsService from '../services/groups.service.js';
import logger from '../../utils/logger.js';

export async function listGroups(req, res, next) {
  try {
    const groups = await groupsService.listGroups(req.db);
    res.json(groups);
  } catch (error) {
    next(error);
  }
}

export async function getGroup(req, res, next) {
  try {
    const group = await groupsService.getGroup(req.db, req.params.id);
    if (!group) return res.status(404).json({ error: '分组不存在' });
    res.json(group);
  } catch (error) {
    next(error);
  }
}

export async function createGroup(req, res, next) {
  try {
    const group = await groupsService.createGroup(req.db, req.body);
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
}

export async function updateGroup(req, res, next) {
  try {
    const group = await groupsService.updateGroup(req.db, req.params.id, req.body);
    if (!group) return res.status(404).json({ error: '分组不存在' });
    res.json(group);
  } catch (error) {
    next(error);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const result = await groupsService.deleteGroup(req.db, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateGroupPermissions(req, res, next) {
  try {
    const group = await groupsService.updateGroupPermissions(req.db, req.params.id, req.body);
    if (!group) return res.status(404).json({ error: '分组不存在' });
    res.json(group);
  } catch (error) {
    next(error);
  }
}

export async function getGroupStudents(req, res, next) {
  try {
    const students = await groupsService.getGroupStudents(req.db, req.params.id);
    res.json(students);
  } catch (error) {
    next(error);
  }
}

export async function addStudentsToGroup(req, res, next) {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: '缺少 userIds 数组' });
    }
    const result = await groupsService.addStudentsToGroup(req.db, req.params.id, userIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function setStudentGroup(req, res, next) {
  try {
    const { studentId } = req.params;
    const { groupId } = req.body;
    const result = await groupsService.setStudentGroup(req.db, studentId, groupId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
