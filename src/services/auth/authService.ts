import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase/client';
import { normalizePhone } from './phoneValidation';

export class AuthServiceError extends Error {
  constructor(message: string, public readonly code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new AuthServiceError('请先配置 Supabase 环境变量', 'SUPABASE_CONFIG_REQUIRED');
  }
  return client;
}

function translateError(message: string): AuthServiceError {
  if (message.includes('rate limit')) return new AuthServiceError('验证码请求过于频繁，请稍后再试', 'RATE_LIMITED');
  if (message.includes('Invalid')) return new AuthServiceError('验证码无效或已过期', 'INVALID_OTP');
  return new AuthServiceError(message || '登录服务暂时不可用，请稍后再试');
}

export const authService = {
  async sendOtp(phone: string): Promise<void> {
    const { error } = await requireClient().auth.signInWithOtp({ phone: normalizePhone(phone) });
    if (error) throw translateError(error.message);
  },

  async verifyOtp(phone: string, token: string): Promise<Session> {
    const { data, error } = await requireClient().auth.verifyOtp({ phone: normalizePhone(phone), token, type: 'sms' });
    if (error || !data.session) throw translateError(error?.message ?? '登录会话创建失败');
    return data.session;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await requireClient().auth.getSession();
    if (error) throw translateError(error.message);
    return data.session;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return requireClient().auth.onAuthStateChange(callback);
  },

  async signOut(): Promise<void> {
    const { error } = await requireClient().auth.signOut();
    if (error) throw translateError(error.message);
  },
};
