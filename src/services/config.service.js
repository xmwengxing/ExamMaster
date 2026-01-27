// 系统配置服务层
// 处理系统配置的读取和更新

/**
 * 获取系统配置
 * @param {Object} db - 数据库实例
 * @returns {Promise<Object>} 系统配置对象
 */
export async function getSystemConfig(db) {
  // 获取主配置
  const mainConfigRow = await db.getOne("SELECT data FROM system_config WHERE id = 'main'");
  const mainConfig = mainConfigRow ? mainConfigRow.data : {};
  
  // 获取 deepseekApiKey（从 system_config_kv 表）
  const deepseekKeyRow = await db.getOne("SELECT value FROM system_config_kv WHERE key = 'deepseekApiKey'");
  const deepseekKey = deepseekKeyRow ? deepseekKeyRow.value : null;
  
  // 合并配置
  return {
    ...mainConfig,
    deepseekApiKey: deepseekKey
  };
}

/**
 * 更新系统配置
 * @param {Object} db - 数据库实例
 * @param {Object} configData - 配置数据
 * @returns {Promise<void>}
 */
export async function updateSystemConfig(db, configData) {
  // 提取 deepseekApiKey
  const deepseekApiKey = configData.deepseekApiKey;
  
  // 从主配置中移除 deepseekApiKey（它将单独存储）
  const mainConfigData = { ...configData };
  delete mainConfigData.deepseekApiKey;
  
  // 保存主配置到 system_config 表（使用 UPSERT）
  await db.execute(
    "INSERT INTO system_config (id, data) VALUES ('main', $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
    [mainConfigData]
  );
  
  // 保存 deepseekApiKey 到 system_config_kv 表
  if (deepseekApiKey !== undefined) {
    await db.execute(
      "INSERT INTO system_config_kv (key, value) VALUES ('deepseekApiKey', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [deepseekApiKey || '']
    );
  }
}

/**
 * 添加自定义字段
 * @param {Object} db - 数据库实例
 * @param {string} fieldName - 字段名称
 * @returns {Promise<void>}
 */
export async function addCustomField(db, fieldName) {
  // 获取当前配置
  const mainConfigRow = await db.getOne("SELECT data FROM system_config WHERE id = 'main'");
  const mainConfig = mainConfigRow ? mainConfigRow.data : {};
  
  // 获取或初始化 customFieldSchema
  const customFieldSchema = mainConfig.customFieldSchema || [];
  
  // 检查字段是否已存在
  if (customFieldSchema.includes(fieldName)) {
    throw new Error('字段已存在');
  }
  
  // 添加新字段
  customFieldSchema.push(fieldName);
  
  // 更新配置
  const updatedConfig = {
    ...mainConfig,
    customFieldSchema
  };
  
  await db.execute(
    "INSERT INTO system_config (id, data) VALUES ('main', $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
    [updatedConfig]
  );
}

/**
 * 删除自定义字段
 * @param {Object} db - 数据库实例
 * @param {string} fieldName - 字段名称
 * @returns {Promise<void>}
 */
export async function removeCustomField(db, fieldName) {
  // 获取当前配置
  const mainConfigRow = await db.getOne("SELECT data FROM system_config WHERE id = 'main'");
  const mainConfig = mainConfigRow ? mainConfigRow.data : {};
  
  // 获取 customFieldSchema
  const customFieldSchema = mainConfig.customFieldSchema || [];
  
  // 移除字段
  const updatedSchema = customFieldSchema.filter(f => f !== fieldName);
  
  // 更新配置
  const updatedConfig = {
    ...mainConfig,
    customFieldSchema: updatedSchema
  };
  
  await db.execute(
    "INSERT INTO system_config (id, data) VALUES ('main', $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
    [updatedConfig]
  );
}
