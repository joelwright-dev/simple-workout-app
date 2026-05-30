-- Groundwork schema (Postgres). Run with: npm run db:init
-- gen_random_uuid() is built into Postgres 13+ core.

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One row per user holding the full AppState blob (rotationIndex, slotStates,
-- logs). Keeps the existing engine/data shape unchanged; swap to normalized
-- tables later without touching the engine.
CREATE TABLE IF NOT EXISTS user_state (
  user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
