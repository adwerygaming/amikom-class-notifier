CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT UNIQUE NOT NULL, -- The Discord ID
    major TEXT NOT NULL,
    entry_year SMALLINT NOT NULL,
    class_number SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    "isActive" BOOLEAN DEFAULT TRUE,
    "IdHari" INT NOT NULL,
    "IdJam" INT NOT NULL,
    "IdKuliah" INT NOT NULL,
    "Keterangan" TEXT NOT NULL,
    "Hari" TEXT NOT NULL,
    "Ruang" TEXT NOT NULL,
    "Waktu" TEXT NOT NULL,
    "Kode" TEXT NOT NULL,
    "MataKuliah" TEXT NOT NULL,
    "JenisKuliah" TEXT NOT NULL,
    "Kelas" TEXT NOT NULL,
    "NamaDosen" TEXT NOT NULL,
    "EmailDosen" TEXT NOT NULL,
    "IsBolehPresensi" INT NOT NULL,
    "IsZoomURL" INT NOT NULL,
    "ZoomURL" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentions BOOLEAN DEFAULT FALSE

    CONSTRAINT subscriptions_user_guild_unique UNIQUE ("userId", "guildId")
);



CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."lastModified" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_schedules_modtime
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();