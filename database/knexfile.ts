import type { Knex } from 'knex';

export const connectionConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'megadulces_logistica',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: { min: 2, max: 10 },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    } : {
      host: process.env.DB_HOST || process.env.PGHOST,
      port: Number(process.env.DB_PORT || process.env.PGPORT) || 5432,
      database: process.env.DB_NAME || process.env.PGDATABASE || 'megadulces_logistica',
      user: process.env.DB_USER || process.env.PGUSER,
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
  },
};
