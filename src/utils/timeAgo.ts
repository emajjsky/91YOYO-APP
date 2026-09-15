/**
 * 智能时间格式化
 * - 60分钟内：N分钟前
 * - 1-24小时：N小时前（取整）
 * - 超过24小时：N天前（取整）
 * - 超过30天：MM-DD
 */
export function formatTimeAgo(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;

  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
}

/**
 * Mock 用：接受已格式化的字符串直接返回（兼容旧 mock 数据）
 */
export function formatTimeAgoFromString(str: string): string {
  // 如果已经是中文格式，直接返回（mock 数据兼容）
  if (/前$|刚刚/.test(str)) return str;
  try {
    return formatTimeAgo(new Date(str));
  } catch {
    return str;
  }
}
