export function validatePhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) return '请输入手机号';
  if (!/^1[3-9]\d{9}$/.test(phone)) return '请输入有效的手机号';
  return null;
}

export function normalizePhone(value: string): string {
  return `+86${value.trim()}`;
}

export function validateOtp(value: string): string | null {
  const code = value.trim();
  if (!code) return '请输入验证码';
  if (!/^\d{6}$/.test(code)) return '请输入 6 位验证码';
  return null;
}
