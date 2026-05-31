// 修复学员在线时长数据
// 将 login_logs 表中的 session_duration 累加到 users 表的 total_online_time
import pkg from 'pg';
const { Pool } = pkg;

const _dbPassword = process.env.DB_PASSWORD;
if (!_dbPassword) {
  console.error('FATAL: DB_PASSWORD environment variable is not set.');
  process.exit(1);
}
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'edumaster',
  user: process.env.DB_USER || 'postgres',
  password: _dbPassword
});

async function fixOnlineTime() {
  const client = await pool.connect();
  
  try {
    console.log('=== 修复学员在线时长数据 ===\n');
    
    // 1. 检查表结构
    console.log('1. 检查表结构...');
    const hasField = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'total_online_time'
    `);
    
    if (hasField.rows.length === 0) {
      console.log('   ❌ total_online_time 字段不存在，正在添加...');
      await client.query('ALTER TABLE users ADD COLUMN total_online_time INTEGER DEFAULT 0');
      console.log('   ✅ 字段添加成功');
    } else {
      console.log('   ✅ total_online_time 字段已存在');
    }
    
    // 2. 统计需要修复的数据
    console.log('\n2. 统计需要修复的数据...');
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN u.total_online_time IS NULL OR u.total_online_time = 0 THEN 1 END) as zero_time_students,
        SUM(COALESCE(ll.session_duration, 0)) as total_session_duration
      FROM users u
      LEFT JOIN login_logs ll ON u.id = ll.user_id
      WHERE u.role = 'STUDENT'
    `);
    
    console.log(`   总学员数: ${stats.rows[0].total_students}`);
    console.log(`   在线时长为0的学员: ${stats.rows[0].zero_time_students}`);
    console.log(`   登录日志中的总时长: ${Math.floor(stats.rows[0].total_session_duration / 3600)}小时`);
    
    // 3. 执行修复
    console.log('\n3. 开始修复数据...');
    
    const result = await client.query(`
      UPDATE users u
      SET total_online_time = (
        SELECT COALESCE(SUM(session_duration), 0)
        FROM login_logs
        WHERE user_id = u.id
      )
      WHERE role = 'STUDENT'
      RETURNING id, real_name, total_online_time
    `);
    
    console.log(`   ✅ 修复完成，共更新 ${result.rows.length} 个学员\n`);
    
    // 4. 显示修复后的数据（前10个）
    console.log('4. 修复后的数据（前10个）：');
    const updated = await client.query(`
      SELECT 
        u.id,
        u.real_name,
        u.phone,
        u.total_online_time,
        COUNT(ll.id) as login_count
      FROM users u
      LEFT JOIN login_logs ll ON u.id = ll.user_id
      WHERE u.role = 'STUDENT'
      GROUP BY u.id, u.real_name, u.phone, u.total_online_time
      ORDER BY u.total_online_time DESC
      LIMIT 10
    `);
    
    updated.rows.forEach((student, index) => {
      const hours = Math.floor(student.total_online_time / 3600);
      const minutes = Math.floor((student.total_online_time % 3600) / 60);
      console.log(`   ${index + 1}. ${student.real_name || '未设置姓名'} (${student.phone})`);
      console.log(`      在线时长: ${hours}h${minutes}m (${student.total_online_time}秒)`);
      console.log(`      登录次数: ${student.login_count}`);
    });
    
    console.log('\n=== 修复完成 ===');
    
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixOnlineTime().catch(console.error);
