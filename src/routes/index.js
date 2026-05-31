/**
 * 路由聚合器
 * 整合所有模块化的路由
 */

import express from 'express';

// 导入所有路由模块
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import bankRoutes from './bank.routes.js';
import questionRoutes from './question.routes.js';
import practiceRoutes from './practice.routes.js';
import examRoutes from './exam.routes.js';
import practicalRoutes from './practical.routes.js';
import discussionRoutes, { commentRouter, questionDiscussionRouter } from './discussion.routes.js';
import aiRoutes, { adminAiRouter } from './ai.routes.js';
import tagRoutes from './tag.routes.js';
import adminRoutes from './admin.routes.js';
import systemRoutes, { progressRouter, adminProgressRouter } from './system.routes.js';
import configRoutes from './config.routes.js';
import mistakeRoutes from './mistake.routes.js';
import favoriteRoutes from './favorite.routes.js';
import noteRoutes from './note.routes.js';
import srsRoutes from './srs.routes.js';
import conversionRoutes from './conversion.routes.js';
import uploadRoutes from './upload.routes.js';
import importRoutes from './import.routes.js';
import logsRoutes from './logs.routes.js';
import registrationRoutes from './registration.routes.js';
import groupsRoutes from './groups.routes.js';
import coursesRoutes from './courses.routes.js';
import interactiveCoursesRoutes from './interactive-courses.routes.js';

/**
 * 注册所有路由到主路由器
 * @param {express.Application} app - Express 应用实例
 */
export function registerRoutes(app) {
  // 系统路由（无需认证）
  app.use('/api', systemRoutes);
  
  // 系统配置路由
  app.use('/api/config', configRoutes);
  
  // 认证路由
  app.use('/api/auth', authRoutes);
  
  // 用户路由
  app.use('/api/user', userRoutes);
  app.use('/api/user', progressRouter);
  app.use('/api/user/admin', adminProgressRouter);
  
  // 题库和题目路由
  app.use('/api/banks', bankRoutes);
  app.use('/api/questions', questionRoutes);
  
  // 练习和考试路由
  app.use('/api/practice', practiceRoutes);
  app.use('/api/exams', examRoutes);
  
  // 实操路由
  app.use('/api/practical', practicalRoutes);
  
  // 讨论路由
  app.use('/api/discussions', discussionRoutes);
  app.use('/api/comments', commentRouter);
  app.use('/api/questions', questionDiscussionRouter);
  
  // AI 路由
  app.use('/api/ai', aiRoutes);
  
  // 标签路由
  app.use('/api/tags', tagRoutes);
  
  // 错题路由
  app.use('/api/mistakes', mistakeRoutes);
  
  // 收藏路由
  app.use('/api/favorites', favoriteRoutes);
  
  // 笔记路由
  app.use('/api/notes', noteRoutes);
  
  // SRS 路由
  app.use('/api/srs', srsRoutes);
  
  // 管理员路由
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin', adminAiRouter);
  
  // 管理员配置路由（自定义字段）
  app.use('/api/admin/config', configRoutes);
  
  // 题库转换路由
  app.use('/api/convert', conversionRoutes);
  
  // 分片上传路由
  app.use('/api/upload', uploadRoutes);
  
  // 导入任务路由
  app.use('/api/import', importRoutes);
  
  // 错误日志路由
  app.use('/api/logs', logsRoutes);
  
  // 报名管理路由
  app.use('/api', registrationRoutes);
  
  // 分组管理路由
  app.use('/api/groups', groupsRoutes);
  
  // 在线课程路由
  app.use('/api/courses', coursesRoutes);
  app.use('/api/interactive-courses', interactiveCoursesRoutes);
  
  console.log('✅ 所有路由已注册');
}

export default registerRoutes;
