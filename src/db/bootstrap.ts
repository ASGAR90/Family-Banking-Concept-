import { client } from "@/db";

/**
 * Create enums + tables if they don't exist yet.
 * PGlite persists to ./data/sprout so this is a no-op after the first run.
 */
export async function ensureSchema() {
  await client.waitReady;
  await client.exec(`
    DO $$ BEGIN
      CREATE TYPE member_role AS ENUM ('parent', 'kid', 'friend');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE task_status AS ENUM ('open', 'pending', 'approved', 'declined');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE lesson_status AS ENUM ('locked', 'open', 'done');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE participant_status AS ENUM ('pending', 'paid');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE txn_kind AS ENUM (
        'task_pay',
        'lesson_reward',
        'goal_deposit',
        'split_in',
        'split_out',
        'allowance'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      initials VARCHAR(4) NOT NULL,
      role member_role NOT NULL,
      color VARCHAR(12) NOT NULL DEFAULT '#C9F158',
      balance_cents INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      tagline VARCHAR(120),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      kid_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      title VARCHAR(140) NOT NULL,
      category VARCHAR(32) NOT NULL DEFAULT 'chore',
      reward_cents INTEGER NOT NULL DEFAULT 100,
      status task_status NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS tasks_kid_idx ON tasks (kid_id);

    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      kid_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      title VARCHAR(120) NOT NULL,
      icon VARCHAR(40) NOT NULL DEFAULT 'target',
      target_cents INTEGER NOT NULL,
      saved_cents INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS goals_kid_idx ON goals (kid_id);

    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      kid_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      title VARCHAR(140) NOT NULL,
      category VARCHAR(40) NOT NULL DEFAULT 'basics',
      minutes INTEGER NOT NULL DEFAULT 5,
      reward_cents INTEGER NOT NULL DEFAULT 150,
      status lesson_status NOT NULL DEFAULT 'locked',
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS lessons_kid_idx ON lessons (kid_id);

    CREATE TABLE IF NOT EXISTS splits (
      id SERIAL PRIMARY KEY,
      title VARCHAR(140) NOT NULL,
      merchant VARCHAR(80),
      payer_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      total_cents INTEGER NOT NULL,
      share_cents INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS split_participants (
      id SERIAL PRIMARY KEY,
      split_id INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      share_cents INTEGER NOT NULL,
      status participant_status NOT NULL DEFAULT 'pending',
      nudges INTEGER NOT NULL DEFAULT 0,
      paid_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS split_participants_split_idx ON split_participants (split_id);

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      kind txn_kind NOT NULL,
      title VARCHAR(160) NOT NULL,
      amount_cents INTEGER NOT NULL,
      counterparty TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS txn_member_idx ON transactions (member_id);
  `);
}
