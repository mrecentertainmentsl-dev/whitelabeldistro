-- ============================================================
-- MREC Music Distribution Platform — PostgreSQL Schema
-- Compatible with DDEX ERN 4.3
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ── Roles ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('admin',  'Platform administrator'),
  ('label',  'Label manager with multi-artist access'),
  ('artist', 'Independent artist')
ON CONFLICT (name) DO NOTHING;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id            UUID REFERENCES roles(id),
  email              VARCHAR(255) UNIQUE NOT NULL,
  password_hash      TEXT NOT NULL,
  first_name         VARCHAR(100),
  last_name          VARCHAR(100),
  display_name       VARCHAR(150),
  avatar_url         TEXT,
  label_name         VARCHAR(200),
  bio                TEXT,
  is_active          BOOLEAN DEFAULT TRUE,
  is_email_verified  BOOLEAN DEFAULT FALSE,
  email_verify_token TEXT,
  reset_pw_token     TEXT,
  reset_pw_expires   TIMESTAMPTZ,
  refresh_token_hash TEXT,
  last_login_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Subscription plans ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(100) NOT NULL,
  price_monthly  NUMERIC(10,2),
  price_annual   NUMERIC(10,2),
  features       JSONB DEFAULT '{}',
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Artists (artist profiles, separate from user accounts) ────────────────────
CREATE TABLE IF NOT EXISTS artists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  bio         TEXT,
  image_url   TEXT,
  spotify_id  VARCHAR(100),
  apple_id    VARCHAR(100),
  isni_code   VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);

-- ── Releases ──────────────────────────────────────────────────────────────────
CREATE TYPE release_type_enum AS ENUM
  ('single','ep','album','compilation','soundtrack','live');

CREATE TYPE release_status_enum AS ENUM
  ('draft','pending','processing','approved','rejected','distributed','takedown');

CREATE TYPE parental_advisory_enum AS ENUM
  ('none','explicit','cleaned');

CREATE TABLE IF NOT EXISTS releases (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core identity
  title                   VARCHAR(500) NOT NULL,
  type                    release_type_enum DEFAULT 'single',
  status                  release_status_enum DEFAULT 'draft',
  parental_advisory       parental_advisory_enum DEFAULT 'none',
  genre                   VARCHAR(100),
  subgenre                VARCHAR(100),
  language                VARCHAR(100) DEFAULT 'English',
  label_name              VARCHAR(255),
  upc                     VARCHAR(20),

  -- Dates
  release_date            DATE,
  original_release_date   DATE,
  scheduled_release_time  VARCHAR(10), -- HH:MM UTC

  -- Artwork
  artwork_url             TEXT,
  artwork_s3_key          TEXT,
  artwork_width           INTEGER,
  artwork_height          INTEGER,

  -- Distribution
  territories             TEXT[] DEFAULT '{worldwide}',
  distribution_platforms  TEXT[] DEFAULT '{}',

  -- Structured credits (DDEX-compatible JSONB)
  -- [{ name, role, isniCode?, spotifyId?, appleId?, sequenceNo }]
  artist_credits          JSONB DEFAULT '[]',
  -- [{ name, role, ipiNumber?, proAffiliation?, sequenceNo }]
  contributor_credits     JSONB DEFAULT '[]',
  -- [{ type, name, ipiNumber?, proAffiliation?, sharePercent }]
  publishing_shares       JSONB DEFAULT '[]',

  -- Workflow
  submission_notes        TEXT,
  admin_notes             TEXT,
  rejected_reason         TEXT,
  submitted_at            TIMESTAMPTZ,
  reviewed_at             TIMESTAMPTZ,
  reviewed_by             VARCHAR(255),

  -- Wizard autosave
  wizard_step             INTEGER DEFAULT 1,
  wizard_draft            JSONB DEFAULT '{}',

  -- Flexible metadata
  metadata                JSONB DEFAULT '{}',

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_releases_user_id   ON releases(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_status     ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_created_at ON releases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_releases_title_trgm ON releases USING gin(title gin_trgm_ops);

-- ── Songs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS songs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id            UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core identity
  title                 VARCHAR(500) NOT NULL,
  title_version         VARCHAR(200),              -- "Radio Edit", "Acoustic", etc.
  track_number          INTEGER DEFAULT 1,
  disc_number           INTEGER DEFAULT 1,
  isrc                  VARCHAR(20),
  is_explicit           BOOLEAN DEFAULT FALSE,
  genre                 VARCHAR(100),
  language              VARCHAR(100),
  lyrics_language       VARCHAR(100),
  lyrics                TEXT,
  preview_start_seconds INTEGER,
  bpm                   INTEGER,

  -- Legacy flat fields (kept for compatibility)
  artist_name           VARCHAR(255),
  featured_artists      TEXT[] DEFAULT '{}',
  composer              VARCHAR(255),
  producer              VARCHAR(255),
  lyricist              VARCHAR(255),

  -- Structured credits (DDEX-compatible JSONB)
  artist_credits        JSONB DEFAULT '[]',
  contributor_credits   JSONB DEFAULT '[]',
  publishing_shares     JSONB DEFAULT '[]',

  -- Audio file
  audio_url             TEXT,
  audio_s3_key          TEXT,
  audio_format          VARCHAR(10),               -- 'wav', 'flac', 'mp3', 'aiff'
  audio_size_bytes      BIGINT,
  audio_bitrate         INTEGER,
  audio_sample_rate     INTEGER,
  audio_bit_depth       INTEGER,
  duration_seconds      INTEGER,

  -- Flexible metadata
  metadata              JSONB DEFAULT '{}',

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_release_id ON songs(release_id);
CREATE INDEX IF NOT EXISTS idx_songs_user_id    ON songs(user_id);

-- ── Uploads (presigned URL tracking) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploads (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  s3_key       TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  content_type VARCHAR(100),
  size_bytes   BIGINT,
  upload_type  VARCHAR(50),                        -- 'audio', 'artwork'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Domains (white-label) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS domains (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain       VARCHAR(255) UNIQUE NOT NULL,
  branding_id  UUID,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);

-- ── Branding ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branding (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_name               VARCHAR(200) DEFAULT 'MREC Entertainment',
  tagline                     TEXT,

  -- Logo assets
  logo_url                    TEXT,
  logo_s3_key                 TEXT,
  favicon_light_url           TEXT,
  square_logo_light_url       TEXT,
  horizontal_logo_light_url   TEXT,
  favicon_dark_url            TEXT,
  square_logo_dark_url        TEXT,
  horizontal_logo_dark_url    TEXT,
  login_bg_url                TEXT,

  -- Colors
  primary_color               VARCHAR(7) DEFAULT '#22c55e',
  secondary_color             VARCHAR(7) DEFAULT '#16a34a',
  accent_color                VARCHAR(7) DEFAULT '#f59e0b',
  background_color            VARCHAR(7) DEFAULT '#0d0d0d',
  text_color                  VARCHAR(7) DEFAULT '#eeeeee',

  -- Typography
  font_heading                VARCHAR(100) DEFAULT 'DM Sans',
  font_body                   VARCHAR(100) DEFAULT 'DM Sans',
  custom_css                  TEXT,

  -- Email branding
  email_logo_url              TEXT,
  email_header_color          VARCHAR(7),
  email_footer_text           TEXT,

  -- Contact
  support_email               VARCHAR(255),
  support_url                 TEXT,
  footer_text                 TEXT,

  -- Legal
  terms_url                   TEXT,
  privacy_url                 TEXT,

  -- Social
  social_links                JSONB DEFAULT '{}',
  is_active                   BOOLEAN DEFAULT TRUE,

  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Settings (encrypted KV store) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key          VARCHAR(255) UNIQUE NOT NULL,
  value        TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Distribution submissions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS distribution_submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id   UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  platform     VARCHAR(100) NOT NULL,
  status       VARCHAR(50) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  error_msg    TEXT,
  metadata     JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_dist_submissions_release_id ON distribution_submissions(release_id);

-- ── Admin logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID REFERENCES users(id),
  action       VARCHAR(255) NOT NULL,
  entity_type  VARCHAR(100),
  entity_id    UUID,
  details      JSONB DEFAULT '{}',
  ip_address   VARCHAR(45),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(100) NOT NULL,
  title        VARCHAR(255),
  message      TEXT,
  is_read      BOOLEAN DEFAULT FALSE,
  data         JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ── Updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_users     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_releases  BEFORE UPDATE ON releases  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_songs     BEFORE UPDATE ON songs     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_branding  BEFORE UPDATE ON branding  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Default seed data ─────────────────────────────────────────────────────────
INSERT INTO branding (platform_name, primary_color) VALUES ('MREC Entertainment', '#22c55e') ON CONFLICT DO NOTHING;
INSERT INTO settings (key, value) VALUES
  ('require_isrc',        'false'),
  ('auto_approve',        'false'),
  ('sender_dpid',         'PADPIDA2024010101O'),
  ('sender_name',         'MREC Entertainment'),
  ('ddex_ern_version',    '4.3'),
  ('delivery_channel',    'AsperaFTP')
ON CONFLICT (key) DO NOTHING;
