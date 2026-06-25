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

  // Task 4 — Gestão de certificados pela CA: registo de certs emitidos e revogados
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issued_certs (
      id           SERIAL PRIMARY KEY,
      cn           VARCHAR(200) NOT NULL,
      fingerprint  VARCHAR(120),
      issued_to    VARCHAR(200),
      issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at   TIMESTAMPTZ,
      revoked      BOOLEAN NOT NULL DEFAULT FALSE,
      revoked_at   TIMESTAMPTZ,
      revoked_reason TEXT
    )
  `);

  // Task 3 — Não Repúdio: cert do cliente + assinatura digital no log
  await pool.query(`
    ALTER TABLE logs
    ADD COLUMN IF NOT EXISTS cert_fingerprint VARCHAR(120)
  `);
  await pool.query(`
    ALTER TABLE logs
    ADD COLUMN IF NOT EXISTS cert_cn VARCHAR(200)
  `);
  await pool.query(`
    ALTER TABLE logs
    ADD COLUMN IF NOT EXISTS signature TEXT
  `);

  await ensureDefaultCategories();
};
