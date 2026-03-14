CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT_NULL DEFAULT NOW(),
    last_modified TIMESTAMPTZ NOT_NULL DEFAULT NOW(),
    guild_id TEXT UNIQUE NOT NULL,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE INDEX idx_guild_id ON subscriptions(guild_id);