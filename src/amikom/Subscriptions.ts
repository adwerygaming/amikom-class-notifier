import { Knex } from "knex"
import DatabaseClient from "../database/Client.js"
import { SubscriptionSchema } from "../types/Database.types.js"

interface RegisterProp {
    channelId: string
    userId: string
    mentions?: string[]
}

export class Subscriptions {
    constructor(
        private readonly guildId: string
    ) { }

    private db(): Knex.QueryBuilder<SubscriptionSchema, SubscriptionSchema[]> {
        return DatabaseClient<SubscriptionSchema>("subscriptions")
    }

    async fetch(): Promise<SubscriptionSchema | null> {
        try {
            const res = await this.db()
                .select("*")
                .where("guild_id", this.guildId)
                .first()

            return res ?? null
        } catch (e) {
            throw new Error(`Failed to fetch subscriptions for guild ${this.guildId}.`, { cause: e })
        }
    }

    async register({ channelId, userId, mentions }: RegisterProp): Promise<SubscriptionSchema> {
        try {
            const [res] = await this.db()
                .insert({
                    guild_id: this.guildId,
                    channel_id: channelId,
                    author_id: userId,
                    mentions: mentions || []
                })
                .returning("*")

            return res
        } catch (e) {
            throw new Error(`Failed to register subscription for guild ${this.guildId}.`, { cause: e })
        }
    }

    async unregister(): Promise<SubscriptionSchema | null> {
        try {
            const [res] = await this.db()
                .where("guild_id", this.guildId)
                .del()
                .returning("*")

            return res ?? null
        } catch (e) {
            throw new Error(`Failed to unregister subscription for guild ${this.guildId}.`, { cause: e })
        }
    }

    async enable(): Promise<SubscriptionSchema | null> {
        try {
            const [res] = await this.db()
                .where("guild_id", this.guildId)
                .update({ is_active: true })
                .returning("*")

            return res ?? null
        } catch (e) {
            throw new Error(`Failed to enable subscription for guild ${this.guildId}.`, { cause: e })
        }
    }

    async disable(): Promise<SubscriptionSchema | null> {
        try {
            const [res] = await this.db()
                .where("guild_id", this.guildId)
                .update({ is_active: false })
                .returning("*")

            return res ?? null
        } catch (e) {
            throw new Error(`Failed to disable subscription for guild ${this.guildId}.`, { cause: e })
        }
    }
}