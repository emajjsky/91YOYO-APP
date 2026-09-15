import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let client: SupabaseClient | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  if (client) return client;

  client = createClient(config.url, config.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void client?.auth.startAutoRefresh();
    } else {
      void client?.auth.stopAutoRefresh();
    }
  });

  return client;
}

export function hasSupabaseConfig(): boolean {
  return getSupabaseConfig() !== null;
}

export function resetSupabaseClientForTests(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
  client = null;
}
