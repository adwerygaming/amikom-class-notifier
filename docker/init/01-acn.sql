CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS schedule_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    major TEXT NOT NULL,
    entry_year INTEGER NOT NULL,
    class_number INTEGER NOT NULL,
    schedule JSONB NOT NULL,
    CONSTRAINT schedule_data_unique_class UNIQUE (major, entry_year, class_number)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    schedule_id UUID NOT NULL REFERENCES schedule_data(id) ON DELETE CASCADE,
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
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_schedule_data_modtime
    BEFORE UPDATE ON schedule_data
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_guild_id ON subscriptions(guild_id);