export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function readEnv(name: string): string {
  return (process.env[name] ?? '').trim();
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv('EXPO_PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey || url.includes('your-project') || anonKey === 'your-anon-key') {
    return null;
  }

  return { url, anonKey };
}
