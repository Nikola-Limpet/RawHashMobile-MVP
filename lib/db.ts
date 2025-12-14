import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://rawhash:rawhash_secret@localhost:5433/rawhash';

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
