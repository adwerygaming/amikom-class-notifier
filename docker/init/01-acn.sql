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

CREATE TABLE IF NOT EXISTS user_class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id     TEXT NOT NULL,
    guild_id    TEXT NOT NULL,
    schedule_id UUID NOT NULL REFERENCES schedule_data(id) ON DELETE CASCADE,
    
    CONSTRAINT user_class_unique UNIQUE (user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    schedule_id UUID NOT NULL REFERENCES schedule_data(id) ON DELETE CASCADE,

    CONSTRAINT subscriptions_guild_channel_unique UNIQUE (guild_id, channel_id),
    CONSTRAINT subscriptions_guild_schedule_unique UNIQUE (guild_id, schedule_id)
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

CREATE TRIGGER update_user_class_assignments_modtime
    BEFORE UPDATE ON user_class_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_guild_id ON subscriptions(guild_id);