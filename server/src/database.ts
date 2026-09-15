import pg from 'pg';

export function createDatabase(databaseUrl: string) {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return {
    pool,
    async check(): Promise<boolean> {
      const result = await pool.query<{ ok: number }>('select 1 as ok');
      return result.rows[0]?.ok === 1;
    },
  };
}
