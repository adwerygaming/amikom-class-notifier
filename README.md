<div align="center">
    <h1>Amikom Class Notifier</h1>
    <p>Get notified when class is starting via <a href="https://discord.com" target="_blank">Discord</a>!</p>
    <img alt="Discord" src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">
    <img alt="NodeJS" src="https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
    <img alt="Docker Compose" src="https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white">
    <img alt="Redis" src="https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white">
    <img alt="Postgres" src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white">
    <br>
    <img alt="Banner" src="./assets/Amikom_Class_Notifier_Banner.png">
</div>

## Features


- **Today & Weekly Schedule** — View your class schedule (same as [AmikomOne App](https://play.google.com/store/apps/details?id=com.ic.projectabsensi&hl=id&pli=1))
- **Class Reminders** — Get notified before class starts
- **Self-hosted** — Full control over your data and deployment

## Try It Yourself

#### Option 1: Use the Public Bot
If you are an **Amikom Student** enrolled in **2025** in **Sistem Informasi 04**, you can invite the bot to your server:

<a href="https://discord.com/oauth2/authorize?client_id=942370077301436418">
    <img alt="Invite Bot" src="https://img.shields.io/badge/invite%20bot-bot?style=for-the-badge&logo=discord&logoColor=%237289da&color=%232c2f33">
</a>

After that, see [Subscribe to Reminders](#subscribe-to-reminders) section.

#### Option 2: Self-Host (Recommended)
For students in other majors, years, or classes, **self-hosting** is required. See the [Setup](#setup) section below.

> [!CAUTION]
> This project is NOT affiliated with Universitas Amikom Yogyakarta. Use it at your own risk.

## How It Works

A Discord bot that automates class reminders by syncing schedule data with real-time events.

| Component | Description |
|-----------|-------------|
| **Data Ingestion** | Schedule data is imported manually via the Amikom student dashboard API and stored as a static JSON file |
| **Polling** | Continuously monitors the schedule file, calculating time differences between current time and upcoming classes |
| **State Management** | Redis stores notification state to prevent duplicates across application restarts |
| **Event Driven** | Redis Pub/Sub decouples the system; events are published when classes are imminent |
| **Subscribers** | Redis subscribers query PostgreSQL for active guild subscriptions and send notifications to Discord channels |

## Prerequisites

- **Node.js** v21 or higher
- **npm** v9 or higher
- **Docker** & **Docker Compose** installed
- **Git**

## Requirements

- Discord account with server admin privileges
- An Amikom account (NPM & password)
- Server/PC capable of running 24/7 (for continuous notifications)

## Setup

> [!NOTE]
> Follow these steps in order.

### 1. Create a Discord Bot

1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Click **New Application** (top-right) if you haven't created a bot yet
4. Enter your **Application Name**
5. Copy the **Application ID** from the application page
6. Go to the **Bot** section (left sidebar)
7. Under **Token**, click **Reset Token** and copy the new token
8. Navigate to **Installation** (left sidebar)
9. Under **Installation Contexts**, select **Guild Install**
10. For **Install Link**, choose **Discord Provided Link** and copy the URL
11. Under **Default Install Settings > Guild Install**, add `applications.commands` and `bot` to **Scopes**
12. Save changes and open the invite URL
13. Select your server to add the bot

**You'll need:** `DISCORD_CLIENT_ID` (Application ID) and `DISCORD_TOKEN` (Bot Token)

### 2. Deploy the Bot

```
# Clone the repository
git clone https://github.com/adwerygaming/amikom-class-notifier
cd amikom-class-notifier

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your credentials (see below)

# Start infrastructure services
docker compose up -d

# Build and start the bot
npm run build
npm run start
```

#### Environment Variables (.env)

```
NODE_ENV=production

# Discord (from step 1)
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_TOKEN=your_bot_token_here

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# PostgreSQL
POSTGRES_PORT=5432
POSTGRES_PASSWORD=your_secure_password_here

# PGAdmin (optional, for database management)
PGADMIN_PORT=8080
PGADMIN_PASSWORD=your_secure_password_here

# Connection string (update with your credentials)
PG_CONNECTION_STRING=postgresql://postgres:your_secure_password_here@localhost:5432/amikom_notifier
```

> [!TIP]
> Generate fast, secure passwords using [it-tools.tech/token-generator](https://it-tools.tech/token-generator)

### 3. Import Your Schedule

1. Log in to [Dashboard Mahasiswa](https://mhs.amikom.ac.id)
2. Once logged in, open this URL: `https://mhs.amikom.ac.id/api/perkuliahan/jadwal_kuliah_personal`
3. You should see JSON data. If not, ensure you're using the same browser session
4. Select all and copy the JSON (`Ctrl+A` then `Ctrl+C`)
5. Paste into a text editor and save as `schedule.json`
6. In your Discord server, run: `/schedule set`
7. Upload the `schedule.json` file when prompted
8. Verify the schedule preview appears

#### Subscribe to Reminders

1. In your Discord server, choose a channel for notifications
2. Run: `/reminder subscribe`
3. The bot will send a test message to confirm
4. Done! You'll now receive class reminders

#### Managing Reminders

- **Unsubscribe:** `/reminder unsubscribe`
- **Check status:** `/reminder status`

## Development

```
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Lint code
npm run lint
```

## Contibuting
Contribution are open to everyone. If you implement something cool & useful, just open PR and we'll discuss there. ❤️

<div align="center">
    <p>This project is not affiliated with Universitas Amikom Yogyakarta</p>
</div>