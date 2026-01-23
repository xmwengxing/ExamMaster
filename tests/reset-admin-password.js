import db from '../db.js';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  try {
    const phone = 'admin';
    const newPassword = 'admin123';
    
    // 生成新密码哈希
    const hash = bcrypt.hashSync(newPassword, 10);
    
    // 更新密码
    await db.execute(
      'UPDATE users SET password = $1 WHERE phone = $2',
      [hash, phone]
    );
    
    console.log('✅ 管理员密码已重置');
    console.log('   手机号:', phone);
    console.log('   新密码:', newPassword);
    
    // 验证密码
    const user = await db.getOne('SELECT * FROM users WHERE phone = $1', [phone]);
    const isValid = bcrypt.compareSync(newPassword, user.password);
    
    if (isValid) {
      console.log('✅ 密码验证成功');
    } else {
      console.log('❌ 密码验证失败');
    }
    
    await db.closePool();
  } catch (error) {
    console.error('重置密码失败:', error);
    process.exit(1);
  }
}

resetAdminPassword();
