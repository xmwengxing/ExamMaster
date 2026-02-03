/**
 * 更新学员信息
 * @param {Object} dbConn - 数据库连接
 * @param {string} studentId - 学员ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} { success: boolean }
 */
import bcrypt from 'bcryptjs';

export async function updateStudent(dbConn, studentId, updates) {
  const { 
    nickname, realName, phone, password, 
    gender, idCard, school, educationType, educationLevel, major, company, className,
    studentPerms, allowedBankIds, customFields
  } = updates;
  
  // 检查学员是否存在
  const existing = await dbConn.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'STUDENT'",
    [studentId]
  );
  
  if (!existing.rows || existing.rows.length === 0) {
    throw new Error('学员不存在');
  }
  
  // 如果更新手机号，检查是否与其他用户冲突
  if (phone) {
    const phoneCheck = await dbConn.query(
      'SELECT id FROM users WHERE phone = $1 AND id != $2',
      [phone, studentId]
    );
    
    if (phoneCheck.rows && phoneCheck.rows.length > 0) {
      throw new Error('手机号已被其他用户使用');
    }
  }
  
  // 构建更新语句
  const updateFields = [];
  const values = [];
  let paramIndex = 1;
  
  if (nickname !== undefined) {
    updateFields.push(`nickname = $${paramIndex++}`);
    values.push(nickname);
  }
  
  if (realName !== undefined) {
    updateFields.push(`real_name = $${paramIndex++}`);
    values.push(realName);
  }
  
  if (phone !== undefined) {
    updateFields.push(`phone = $${paramIndex++}`);
    values.push(phone);
  }
  
  if (password !== undefined && password !== '') {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateFields.push(`password = $${paramIndex++}`);
    values.push(hashedPassword);
  }
  
  if (gender !== undefined) {
    updateFields.push(`gender = $${paramIndex++}`);
    values.push(gender);
  }
  
  if (idCard !== undefined) {
    updateFields.push(`id_card = $${paramIndex++}`);
    values.push(idCard);
  }
  
  if (school !== undefined) {
    updateFields.push(`school = $${paramIndex++}`);
    values.push(school);
  }
  
  if (educationType !== undefined) {
    updateFields.push(`education_type = $${paramIndex++}`);
    values.push(educationType);
  }
  
  if (educationLevel !== undefined) {
    updateFields.push(`education_level = $${paramIndex++}`);
    values.push(educationLevel);
  }
  
  if (major !== undefined) {
    updateFields.push(`major = $${paramIndex++}`);
    values.push(major);
  }
  
  if (company !== undefined) {
    updateFields.push(`company = $${paramIndex++}`);
    values.push(company);
  }
  
  if (className !== undefined) {
    updateFields.push(`class_name = $${paramIndex++}`);
    values.push(className);
  }
  
  if (studentPerms !== undefined) {
    const permsArray = Array.isArray(studentPerms) ? studentPerms : [];
    updateFields.push(`student_perms = $${paramIndex++}`);
    values.push(JSON.stringify(permsArray));
  }
  
  if (allowedBankIds !== undefined) {
    const bankIdsArray = Array.isArray(allowedBankIds) ? allowedBankIds : [];
    updateFields.push(`allowed_bank_ids = $${paramIndex++}`);
    values.push(JSON.stringify(bankIdsArray));
  }
  
  if (customFields !== undefined) {
    updateFields.push(`custom_fields = $${paramIndex++}`);
    values.push(JSON.stringify(customFields || {}));
  }
  
  if (updateFields.length === 0) {
    return { success: true }; // 没有需要更新的字段
  }
  
  values.push(studentId);
  
  const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
  console.log('[Admin] updateStudent SQL:', sql);
  console.log('[Admin] updateStudent values:', values);
  
  await dbConn.query(sql, values);
  
  console.log(`[Admin] Updated student: ${studentId}`);
  
  return { success: true };
}
