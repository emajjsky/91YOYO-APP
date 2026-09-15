import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { authService, AuthServiceError } from '../services/auth/authService';
import { validateOtp, validatePhone } from '../services/auth/phoneValidation';
import { hasSupabaseConfig } from '../services/supabase/client';
import type { AuthStatus } from '../types/auth';

let unsubscribe: (() => void) | null = null;

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  phone: string;
  otpSent: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  setPhone: (phone: string) => void;
  clearError: () => void;
  sendOtp: () => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

function errorMessage(error: unknown): string {
  if (error instanceof AuthServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return '操作失败，请稍后再试';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  session: null,
  phone: '',
  otpSent: false,
  isSubmitting: false,
  errorMessage: null,

  setPhone: (phone) => set({ phone, errorMessage: null }),
  clearError: () => set({ errorMessage: null }),

  sendOtp: async () => {
    const phone = get().phone.trim();
    const validationError = validatePhone(phone);
    if (validationError) {
      set({ errorMessage: validationError });
      return false;
    }

    set({ isSubmitting: true, errorMessage: null });
    try {
      await authService.sendOtp(phone);
      set({ otpSent: true, isSubmitting: false });
      return true;
    } catch (error) {
      set({ isSubmitting: false, errorMessage: errorMessage(error) });
      return false;
    }
  },

  verifyOtp: async (otp) => {
    const phone = get().phone.trim();
    const validationError = validateOtp(otp);
    if (validationError) {
      set({ errorMessage: validationError });
      return false;
    }

    set({ isSubmitting: true, errorMessage: null });
    try {
      const session = await authService.verifyOtp(phone, otp.trim());
      set({ session, status: 'signed_in', isSubmitting: false });
      return true;
    } catch (error) {
      set({ isSubmitting: false, errorMessage: errorMessage(error) });
      return false;
    }
  },

  initialize: async () => {
    if (!hasSupabaseConfig()) {
      set({ status: 'setup_required', session: null });
      return;
    }

    set({ status: 'loading', errorMessage: null });
    try {
      const session = await authService.getSession();
      unsubscribe?.();
      const listener = authService.onAuthStateChange((_event, nextSession) => {
        set({
          session: nextSession,
          status: nextSession ? 'signed_in' : 'signed_out',
        });
      });
      unsubscribe = listener.data.subscription.unsubscribe;
      set({ session, status: session ? 'signed_in' : 'signed_out' });
    } catch (error) {
      set({ session: null, status: 'signed_out', errorMessage: errorMessage(error) });
    }
  },

  signOut: async () => {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await authService.signOut();
      set({ session: null, status: 'signed_out', otpSent: false, isSubmitting: false });
    } catch (error) {
      set({ isSubmitting: false, errorMessage: errorMessage(error) });
    }
  },
}));
