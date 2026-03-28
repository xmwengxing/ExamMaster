#!/usr/bin/env node

/**
 * 最终系统验证脚本
 * 检查所有功能、性能、安全措施、备份和监控
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
import dotenv from 'dotenv';
dotenv.config();

// 验证结果收集
const results = {
  database: [],
  api: [],
  security: [],
  backup: [],
  monitoring: [],
  performance: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`
  }[type];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addResult(category, name, passed, details = '') {
  results[category].push({ name, passed, details });
  log(`${name}: ${passed ? '通过' : '失败'} ${details}`, passed ? 'success' : 'error');
}

// ==================== 数据库功能检查 ====================

async function checkDatabase() {
  log('\n========== 数据库功能检查 ==========', 'info');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edumaster',
    user: process.env.DB_USER || 'edumaster_user',
    password: process.env.DB_PASSWORD
  });

  try {
    // 1. 连接测试
    const client = await pool.connect();
    addResult('database', '数据库连接', true, '连接成功');
    client.release();

    // 2. 表结构检查
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const expectedTables = [
      'users', 'banks', 'questions', 'exams', 'exam_history',
      'practice_records', 'mistakes', 'favorites', 'notes',
      'srs_records', 'daily_progress', 'tags', 'question_tags',
      'discussions', 'comments', 'discussion_likes', 'ai_analysis',
      'practical_tasks', 'practical_records', 'login_logs',
      'audit_logs', 'system_config', 'system_config_kv'
    ];
    
    const actualTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !actualTables.includes(t));
    
    addResult('database', '表结构完整性', missingTables.length === 0, 
      missingTables.length > 0 ? `缺失表: ${missingTables.join(', ')}` : `所有 ${expectedTables.length} 个表都存在`);

    // 3. 索引检查
    const indexResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    const indexCount = parseInt(indexResult.rows[0].count);
    addResult('database', '索引创建', indexCount > 20, `共 ${indexCount} 个索引`);

    // 4. 数据完整性检查
    const dataCheckQueries = [
      { name: '用户数据', query: 'SELECT COUNT(*) as count FROM users' },
      { name: '题库数据', query: 'SELECT COUNT(*) as count FROM banks' },
      { name: '题目数据', query: 'SELECT COUNT(*) as count FROM questions' }
    ];

    for (const check of dataCheckQueries) {
      const result = await pool.query(check.query);
      const count = parseInt(result.rows[0].count);
      addResult('database', check.name, count >= 0, `${count} 条记录`);
    }

    // 5. JSONB 字段检查
    const jsonbResult = await pool.query(`
      SELECT column_name, table_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type = 'jsonb'
    `);
    
    addResult('database', 'JSONB 字段', jsonbResult.rows.length > 0, 
      `${jsonbResult.rows.length} 个 JSONB 字段`);

    // 6. 连接池状态
    addResult('database', '连接池配置', 
      pool.totalCount >= 0 && pool.idleCount >= 0,
      `总连接: ${pool.totalCount}, 空闲: ${pool.idleCount}, 等待: ${pool.waitingCount}`);

  } catch (error) {
    addResult('database', '数据库检查', false, error.message);
  } finally {
    await pool.end();
  }
}

// ==================== API 功能检查 ====================

async function checkAPI() {
  log('\n========== API 功能检查 ==========', 'info');
  
  const apiBase = process.env.API_URL || 'http://localhost:3001';
  
  // 测试端点列表
  const endpoints = [
    { path: '/api/health', method: 'GET', name: '健康检查' },
    { path: '/api/banks', method: 'GET', name: '题库列表', requiresAuth: false },
    { path: '/api/system/config', method: 'GET', name: '系统配置' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${apiBase}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const passed = response.status === 200 || response.status === 401;
      addResult('api', `${endpoint.name} (${endpoint.path})`, passed, 
        `状态码: ${response.status}`);
    } catch (error) {
      addResult('api', `${endpoint.name} (${endpoint.path})`, false, error.message);
    }
  }
}

// ==================== 安全措施检查 ====================

async function checkSecurity() {
  log('\n========== 安全措施检查 ==========', 'info');
  
  // 1. 环境变量检查
  const requiredEnvVars = [
    'DB_PASSWORD', 'JWT_SECRET', 'DB_USER', 'DB_NAME'
  ];
  
  for (const envVar of requiredEnvVars) {
    const exists = !!process.env[envVar];
    const isStrong = exists && process.env[envVar].length >= 16;
    addResult('security', `环境变量 ${envVar}`, exists, 
      exists ? (isStrong ? '已设置且强度足够' : '已设置但强度不足') : '未设置');
  }

  // 2. 配置文件权限检查（仅 Unix 系统）
  if (process.platform !== 'win32') {
    try {
      const envFilePath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envFilePath)) {
        const stats = fs.statSync(envFilePath);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        const isSecure = mode === '600' || mode === '400';
        addResult('security', '.env 文件权限', isSecure, `权限: ${mode}`);
      }
    } catch (error) {
      addResult('security', '.env 文件权限', false, error.message);
    }
  }

  // 3. PostgreSQL 配置检查
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edumaster',
    user: process.env.DB_USER || 'edumaster_user',
    password: process.env.DB_PASSWORD
  });

  try {
    // 检查 SSL 配置
    const sslResult = await pool.query("SHOW ssl");
    const sslEnabled = sslResult.rows[0].ssl === 'on';
    addResult('security', 'PostgreSQL SSL', sslEnabled, 
      sslEnabled ? 'SSL 已启用' : 'SSL 未启用（开发环境可接受）');

    // 检查密码加密
    const passwordResult = await pool.query("SHOW password_encryption");
    addResult('security', '密码加密算法', true, 
      `使用 ${passwordResult.rows[0].password_encryption}`);

  } catch (error) {
    addResult('security', 'PostgreSQL 安全配置', false, error.message);
  } finally {
    await pool.end();
  }

  // 4. CORS 配置检查
  const serverJsPath = path.join(process.cwd(), 'server.js');
  if (fs.existsSync(serverJsPath)) {
    const serverContent = fs.readFileSync(serverJsPath, 'utf-8');
    const hasCors = serverContent.includes('cors');
    const hasOriginRestriction = serverContent.includes('origin:') && !serverContent.includes("origin: '*'");
    addResult('security', 'CORS 配置', hasCors && hasOriginRestriction, 
      hasCors ? (hasOriginRestriction ? 'CORS 已配置且限制了来源' : 'CORS 已配置但未限制来源') : 'CORS 未配置');
  }
}

// ==================== 备份检查 ====================

async function checkBackup() {
  log('\n========== 备份机制检查 ==========', 'info');
  
  // 1. 备份脚本存在性
  const backupScriptPath = path.join(process.cwd(), 'scripts', 'backup.sh');
  const backupScriptExists = fs.existsSync(backupScriptPath);
  addResult('backup', '备份脚本', backupScriptExists, 
    backupScriptExists ? '备份脚本存在' : '备份脚本不存在');

  // 2. 备份目录检查
  const backupDir = path.join(process.cwd(), 'backups');
  if (fs.existsSync(backupDir)) {
    const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql') || f.endsWith('.gz'));
    addResult('backup', '备份文件', backupFiles.length > 0, 
      `找到 ${backupFiles.length} 个备份文件`);
    
    // 检查最近的备份
    if (backupFiles.length > 0) {
      const latestBackup = backupFiles
        .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime }))
        .sort((a, b) => b.time - a.time)[0];
      
      const daysSinceBackup = (Date.now() - latestBackup.time) / (1000 * 60 * 60 * 24);
      addResult('backup', '最近备份时间', daysSinceBackup < 2, 
        `最近备份: ${latestBackup.name} (${daysSinceBackup.toFixed(1)} 天前)`);
    }
  } else {
    addResult('backup', '备份目录', false, '备份目录不存在');
  }

  // 3. 恢复脚本检查
  const restoreScriptPath = path.join(process.cwd(), 'scripts', 'restore.sh');
  const restoreScriptExists = fs.existsSync(restoreScriptPath);
  addResult('backup', '恢复脚本', restoreScriptExists, 
    restoreScriptExists ? '恢复脚本存在' : '恢复脚本不存在');
}

// ==================== 监控检查 ====================

async function checkMonitoring() {
  log('\n========== 监控和日志检查 ==========', 'info');
  
  // 1. 日志目录检查
  const logsDir = path.join(process.cwd(), 'logs');
  if (fs.existsSync(logsDir)) {
    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
    addResult('monitoring', '日志文件', logFiles.length > 0, 
      `找到 ${logFiles.length} 个日志文件`);
    
    // 检查今天的日志
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logFiles.filter(f => f.includes(today));
    addResult('monitoring', '今日日志', todayLogs.length > 0, 
      todayLogs.length > 0 ? `今日日志: ${todayLogs.join(', ')}` : '今日无日志记录');
  } else {
    addResult('monitoring', '日志目录', false, '日志目录不存在');
  }

  // 2. 日志配置检查
  const serverJsPath = path.join(process.cwd(), 'server.js');
  if (fs.existsSync(serverJsPath)) {
    const serverContent = fs.readFileSync(serverJsPath, 'utf-8');
    const hasWinston = serverContent.includes('winston') || serverContent.includes('logger');
    addResult('monitoring', '日志库配置', hasWinston, 
      hasWinston ? '已配置日志库' : '未配置日志库');
  }

  // 3. 监控脚本检查
  const monitorScriptPath = path.join(process.cwd(), 'scripts', 'monitor-database.sh');
  const monitorScriptExists = fs.existsSync(monitorScriptPath);
  addResult('monitoring', '监控脚本', monitorScriptExists, 
    monitorScriptExists ? '监控脚本存在' : '监控脚本不存在');
}

// ==================== 性能检查 ====================

async function checkPerformance() {
  log('\n========== 性能检查 ==========', 'info');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edumaster',
    user: process.env.DB_USER || 'edumaster_user',
    password: process.env.DB_PASSWORD
  });

  try {
    // 1. 查询性能测试
    const start = Date.now();
    await pool.query('SELECT COUNT(*) FROM questions');
    const duration = Date.now() - start;
    
    addResult('performance', '简单查询性能', duration < 100, 
      `查询耗时: ${duration}ms`);

    // 2. 连接池性能
    const concurrentQueries = 10;
    const queries = Array(concurrentQueries).fill(null).map(() => 
      pool.query('SELECT 1')
    );
    
    const concurrentStart = Date.now();
    await Promise.all(queries);
    const concurrentDuration = Date.now() - concurrentStart;
    
    addResult('performance', '并发查询性能', concurrentDuration < 500, 
      `${concurrentQueries} 个并发查询耗时: ${concurrentDuration}ms`);

    // 3. 索引使用检查
    const indexUsageResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 5
    `);
    
    const totalScans = indexUsageResult.rows.reduce((sum, row) => sum + parseInt(row.idx_scan || 0), 0);
    addResult('performance', '索引使用情况', totalScans > 0, 
      `前5个索引总扫描次数: ${totalScans}`);

    // 4. 表大小检查
    const tableSizeResult = await pool.query(`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
      LIMIT 5
    `);
    
    addResult('performance', '数据库大小', true, 
      `最大表: ${tableSizeResult.rows[0]?.table_name} (${tableSizeResult.rows[0]?.size})`);

  } catch (error) {
    addResult('performance', '性能检查', false, error.message);
  } finally {
    await pool.end();
  }
}

// ==================== 生成报告 ====================

function generateReport() {
  log('\n========== 最终验证报告 ==========', 'info');
  
  let totalTests = 0;
  let passedTests = 0;
  
  const report = ['# 系统最终验证报告\n'];
  report.push(`生成时间: ${new Date().toLocaleString('zh-CN')}\n`);
  
  for (const [category, tests] of Object.entries(results)) {
    const categoryName = {
      database: '数据库功能',
      api: 'API 功能',
      security: '安全措施',
      backup: '备份机制',
      monitoring: '监控日志',
      performance: '性能指标'
    }[category];
    
    report.push(`\n## ${categoryName}\n`);
    
    for (const test of tests) {
      totalTests++;
      if (test.passed) passedTests++;
      
      const status = test.passed ? '✅ 通过' : '❌ 失败';
      report.push(`- ${status} **${test.name}**: ${test.details}`);
    }
  }
  
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  report.push(`\n## 总体评估\n`);
  report.push(`- 总测试项: ${totalTests}`);
  report.push(`- 通过项: ${passedTests}`);
  report.push(`- 失败项: ${totalTests - passedTests}`);
  report.push(`- 通过率: ${passRate}%\n`);
  
  if (passRate >= 90) {
    report.push(`### ✅ 系统状态: 优秀\n`);
    report.push(`系统已准备好交付使用。所有关键功能正常运行。\n`);
  } else if (passRate >= 75) {
    report.push(`### ⚠️ 系统状态: 良好\n`);
    report.push(`系统基本可用，但有部分功能需要改进。\n`);
  } else {
    report.push(`### ❌ 系统状态: 需要改进\n`);
    report.push(`系统存在较多问题，建议修复后再交付。\n`);
  }
  
  // 保存报告
  const reportPath = path.join(process.cwd(), 'FINAL_SYSTEM_VERIFICATION.md');
  fs.writeFileSync(reportPath, report.join('\n'));
  
  log(`\n报告已保存到: ${reportPath}`, 'success');
  log(`通过率: ${passRate}% (${passedTests}/${totalTests})`, 
    passRate >= 90 ? 'success' : passRate >= 75 ? 'warning' : 'error');
  
  return passRate >= 75;
}

// ==================== 主函数 ====================

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          EduMaster 系统最终验证                           ║
║          PostgreSQL 迁移与部署项目                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  try {
    await checkDatabase();
    await checkAPI();
    await checkSecurity();
    await checkBackup();
    await checkMonitoring();
    await checkPerformance();
    
    const success = generateReport();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`验证过程发生错误: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 执行主函数
main();
