/**
 * 日期格式化工具函数
 */

/**
 * 格式化出生年月为 YYYY.MM 格式
 * @param date - 日期对象或 dayjs 对象
 * @returns 格式化后的字符串
 */
export const formatBirthDate = (date: any): string => {
  if (!date) return '';
  
  // 如果是 dayjs 对象
  if ('format' in date && typeof date.format === 'function') {
    return date.format('YYYY.MM');
  }
  
  // 如果是 Date 对象或字符串
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}.${month}`;
};

/**
 * 格式化毕业时间为 YYYY 年 MM 月格式
 * @param date - 日期对象或 dayjs 对象
 * @returns 格式化后的字符串
 */
export const formatGraduationDate = (date: any): string => {
  if (!date) return '';
  
  // 如果是 dayjs 对象
  if ('format' in date && typeof date.format === 'function') {
    return date.format('YYYY 年 MM 月');
  }
  
  // 如果是 Date 对象或字符串
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return `${year}年${month}月`;
};

/**
 * 格式化工作时间段为 YYYY 年 XX 月至 YYYY 年 XX 月格式
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 格式化后的时间段字符串
 */
export const formatWorkPeriod = (startDate: any, endDate: any): string => {
  if (!startDate || !endDate) return '';
  return `${formatGraduationDate(startDate).replace('年', '年').replace('月', '年 XX 月')}至${formatGraduationDate(endDate)}`;
};

/**
 * 验证日期格式是否正确
 * @param date - 日期
 * @returns 是否有效
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};
