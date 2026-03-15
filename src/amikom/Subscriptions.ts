import { Knex } from "knex"
import DatabaseClient from "../database/Client.js"
import { SubscriptionSchema } from "../types/Database.types.js"

interface RegisterProp {
    channelId: string
    userId: string
    mentions?: string[]
}

export class DuplicateSubscriptionError extends Error {
    constructor(guildId: string) {
        super(`Guild ${guildId} is already registered.`)
        this.name = "DuplicateSubscriptionError"
    }
}

export class InvalidSubscriptionDataError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "InvalidSubscriptionDataError"
    }
}

const db = DatabaseClient<SubscriptionSchema>("subscriptions")
export async function fetchAllGuilds(): Promise<SubscriptionSchema[]> {
    const res = await db.select("*")
    return res
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

    async update(props: Partial<Omit<SubscriptionSchema, "id" | "guild_id" | "created_at" | "last_modified">>): Promise<SubscriptionSchema | null> {
        if (Object.keys(props).length === 0) {
            throw new Error("No fields provided to update.")
        }

        try {
            const [res] = await this.db()
                .where("guild_id", this.guildId)
                .update(props)
                .returning("*")

            return res ?? null
        } catch (e) {
            throw new Error(`Failed to update subscriptions for guild ${this.guildId}.`, { cause: e })
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            if (e.code === "23505") { // unique violation
                throw new DuplicateSubscriptionError(this.guildId)            
            } else if (e.code === "22P02") { // invalid text representation, likely due to mentions array not being in correct format
                throw new InvalidSubscriptionDataError("Invalid data format for subscription. Please check your input.")
            }

            // generic error fallback
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