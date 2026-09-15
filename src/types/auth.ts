import type { Session } from '@supabase/supabase-js';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in' | 'setup_required';

export interface AuthStateSnapshot {
  status: AuthStatus;
  session: Session | null;
}
