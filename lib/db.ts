// The single place that talks to Postgres. v2 persistence backend (replaces the
// v1 localStorage module). Reads POSTGRES_URL (Vercel Postgres) or DATABASE_URL.
//
// Uses node-postgres (`pg`) so the same code runs against Vercel Postgres, Neon,
// or a plain local Postgres via the connection string. Route handlers and server
// actions run in the Node runtime, so `pg` is safe here (middleware never imports
// this file — it stays edge-safe).

import { Pool } from "pg";
import type { AppState } from "./types";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

function sslOption(cs: string): false | { rejectUnauthorized: boolean } {
  if (/localhost|127\.0\.0\.1/.test(cs)) return false;
  if (/sslmode=disable/.test(cs)) return false;
  return { rejectUnauthorized: false };
}

// Reuse one pool across hot reloads in dev.
const globalForPg = globalThis as unknown as { __gwPool?: Pool };

function getPool(): Pool {
  if (!connectionString) {
    throw new Error(
      "No database connection string. Set POSTGRES_URL (or DATABASE_URL).",
    );
  }
  if (!globalForPg.__gwPool) {
    globalForPg.__gwPool = new Pool({
      connectionString,
      ssl: sslOption(connectionString),
      max: 5,
    });
  }
  return globalForPg.__gwPool;
}

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await getPool().query<DbUser>(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email.toLowerCase().trim()],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<DbUser> {
  const { rows } = await getPool().query<DbUser>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, password_hash`,
    [email.toLowerCase().trim(), passwordHash],
  );
  return rows[0];
}

export async function getUserState(userId: string): Promise<AppState | null> {
  const { rows } = await getPool().query<{ state: AppState }>(
    "SELECT state FROM user_state WHERE user_id = $1",
    [userId],
  );
  return rows[0]?.state ?? null;
}

export async function saveUserState(
  userId: string,
  state: AppState,
): Promise<void> {
  await getPool().query(
    `INSERT INTO user_state (user_id, state, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (user_id)
     DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [userId, state],
  );
}
