/**
 * 标签模块控制器
 */

import * as tagService from '../services/tag.service.js';

export async function getTags(req, res) {
  try {
    const tags = await tagService.getTags();
    res.json({ tags });
  } catch (error) {
    console.error('[Tags] Get error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createTag(req, res) {
  try {
    const result = await tagService.createTag(req.body);
    res.json(result);
  } catch (error) {
    console.error('[Tags] Create error:', error);
    const status = error.message.includes('不能为空') ? 400 : error.message.includes('已存在') ? 409 : 500;
    res.status(status).json({ error: error.message });
  }
}

export async function updateTag(req, res) {
  try {
    const result = await tagService.updateTag(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('[Tags] Update error:', error);
    let status = 500;
    if (error.message.includes('不能为空') || error.message.includes('没有要更新')) status = 400;
    else if (error.message === '标签不存在') status = 404;
    else if (error.message.includes('已存在')) status = 409;
    res.status(status).json({ error: error.message });
  }
}

export async function deleteTag(req, res) {
  try {
    const result = await tagService.deleteTag(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('[Tags] Delete error:', error);
    const status = error.message === '标签不存在' ? 404 : error.message.includes('正在使用') ? 400 : 500;
    const response = { error: error.message };
    if (error.usageCount) response.usageCount = error.usageCount;
    res.status(status).json(response);
  }
}

export async function mergeTags(req, res) {
  try {
    const { sourceTagId, targetTagId } = req.body;
    const result = await tagService.mergeTags(sourceTagId, targetTagId);
    res.json(result);
  } catch (error) {
    console.error('[Tags] Merge error:', error);
    const status = error.message.includes('缺少') || error.message.includes('不能相同') ? 400 : error.message === '标签不存在' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}
