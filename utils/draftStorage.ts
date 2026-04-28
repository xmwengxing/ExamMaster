/**
 * 草稿保存工具函数
 * 使用 localStorage 实现表单草稿的自动保存和恢复
 */

const DRAFT_PREFIX = 'registration_draft_';

/**
 * 保存草稿到 localStorage
 * @param formKey - 表单唯一标识
 * @param data - 要保存的表单数据
 */
export const saveDraft = (formKey: string, data: any): void => {
  try {
    const draftData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${DRAFT_PREFIX}${formKey}`, JSON.stringify(draftData));
    console.log('[草稿保存] 草稿已保存', formKey);
  } catch (error) {
    console.error('[草稿保存] 保存失败:', error);
  }
};

/**
 * 从 localStorage 恢复草稿
 * @param formKey - 表单唯一标识
 * @returns 草稿数据，如果不存在则返回 null
 */
export const loadDraft = (formKey: string): any => {
  try {
    const draftStr = localStorage.getItem(`${DRAFT_PREFIX}${formKey}`);
    if (!draftStr) {
      return null;
    }
    
    const draftData = JSON.parse(draftStr);
    
    // 检查草稿是否超过 7 天
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - draftData.timestamp > sevenDays) {
      console.log('[草稿恢复] 草稿已过期，自动清除');
      removeDraft(formKey);
      return null;
    }
    
    console.log('[草稿恢复] 草稿已恢复', formKey);
    return draftData.data;
  } catch (error) {
    console.error('[草稿恢复] 恢复失败:', error);
    return null;
  }
};

/**
 * 移除草稿
 * @param formKey - 表单唯一标识
 */
export const removeDraft = (formKey: string): void => {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${formKey}`);
    console.log('[草稿清除] 草稿已清除', formKey);
  } catch (error) {
    console.error('[草稿清除] 清除失败:', error);
  }
};

/**
 * 检查是否存在草稿
 * @param formKey - 表单唯一标识
 * @returns 是否存在草稿
 */
export const hasDraft = (formKey: string): boolean => {
  try {
    const draftStr = localStorage.getItem(`${DRAFT_PREFIX}${formKey}`);
    return !!draftStr;
  } catch (error) {
    return false;
  }
};

/**
 * 清除所有草稿
 */
export const clearAllDrafts = (): void => {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(DRAFT_PREFIX));
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('[草稿清除] 已清除所有草稿');
  } catch (error) {
    console.error('[草稿清除] 清除失败:', error);
  }
};

/**
 * 获取所有草稿列表
 * @returns 草稿列表
 */
export const getAllDrafts = (): Array<{ key: string; timestamp: number }> => {
  try {
    const drafts: Array<{ key: string; timestamp: number }> = [];
    Object.keys(localStorage)
      .filter(key => key.startsWith(DRAFT_PREFIX))
      .forEach(key => {
        const draftStr = localStorage.getItem(key);
        if (draftStr) {
          const draftData = JSON.parse(draftStr);
          drafts.push({
            key: key.replace(DRAFT_PREFIX, ''),
            timestamp: draftData.timestamp
          });
        }
      });
    return drafts;
  } catch (error) {
    console.error('[草稿列表] 获取失败:', error);
    return [];
  }
};
