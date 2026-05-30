// Create the database tables. Run: npm run db:init
// Reads POSTGRES_URL / DATABASE_URL from the environment (.env.local supported).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal env-file loader (no dependency) so `npm run db:init` just works.
// Checks .env.local first, then .env.
for (const file of [".env.local", ".env"]) {
  try {
    const env = readFileSync(resolve(__dirname, "..", file), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* file not present — try the next one / shell environment */
  }
}

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set POSTGRES_URL (or DATABASE_URL) before running db:init.");
  process.exit(1);
}

const ssl = /localhost|127\.0\.0\.1|sslmode=disable/.test(connectionString)
  ? false
  : { rejectUnauthorized: false };

const sql = readFileSync(resolve(__dirname, "../db/schema.sql"), "utf8");
const client = new pg.Client({ connectionString, ssl });

await client.connect();
await client.query(sql);
await client.end();
console.log("✓ Schema applied.");
