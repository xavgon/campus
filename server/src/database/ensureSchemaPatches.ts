import { ensureDefaultCategories } from '../models/category.model';
import { getPool } from './pool';
import { DEFAULT_ADMIN_EMAIL } from './seedAdmin';

/** Alterações incrementais ao schema (idempotentes). */
export const ensureSchemaPatches = async (): Promise<void> => {
  const pool = getPool();

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
  `);

  await pool.query(
    `UPDATE users SET role = 'admin' WHERE email = $1`,
    [DEFAULT_ADMIN_EMAIL.toLowerCase()],
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS streams (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
      host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      scheduled_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      media_type VARCHAR(20),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status)
  `);

  await pool.query(`
    ALTER TABLE streams
    ADD COLUMN IF NOT EXISTS media_type VARCHAR(20)
  `);

  await pool.query(`
    ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)
  `);

  await pool.query(`
    ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id SERIAL PRIMARY KEY,
      type VARCHAR(40) NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'info',
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      target_href VARCHAR(300),
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
    ON admin_notifications(created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
    ON admin_notifications(read_at)
    WHERE read_at IS NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS live_comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body VARCHAR(500) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_live_comments_stream_created
    ON live_comments(stream_id, created_at ASC)
  `);

  await ensureDefaultCategories();
};
