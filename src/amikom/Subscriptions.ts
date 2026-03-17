import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { SubscriptionSchema, SubscriptionWithScheduleData } from "../types/Database.types.js";

type RegisterProp = Omit<SubscriptionSchema, "id" | "guild_id" | "created_at" | "last_modified" | "is_active">
type UpdateProp = Partial<Omit<SubscriptionSchema, "id" | "guild_id" | "created_at" | "last_modified">>

export class DuplicateSubscriptionError extends Error {
    constructor(guildId: string, channelId: string) {
        super(`Channel ${channelId} on ${guildId} is already registered to other schedule.`);
        this.name = "DuplicateSubscriptionError";
    }
}

export class DuplicateScheduleSubscriptionError extends Error {
    constructor(guildId: string, scheduleId: string) {
        super(`Guild ${guildId} already registered this class (${scheduleId}) to other channel. A guild can only subscribe to one channel per schedule.`);
        this.name = "DuplicateScheduleSubscriptionError";
    }
}

export class InvalidSubscriptionDataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidSubscriptionDataError";
    }
}

export class Subscriptions {
    constructor(
        private readonly guildId: string
    ) { }

    private db(): Knex.QueryBuilder<SubscriptionSchema, SubscriptionSchema[]> {
        return DatabaseClient<SubscriptionSchema>("subscriptions");
    }

    static db(): Knex.QueryBuilder<SubscriptionSchema, SubscriptionSchema[]> {
        return DatabaseClient<SubscriptionSchema>("subscriptions");
    }
    
    static async fetchAllGuilds(): Promise<SubscriptionSchema[]> {
        const res = await this.db().select("*");
        return res;
    }

    static async fetchByScheduleId(scheduleId: string): Promise<SubscriptionWithScheduleData[]> {
        try {
            const res = await this.db()
                .leftJoin("schedule_data", "subscriptions.schedule_id", "schedule_data.id")
                .where("subscriptions.schedule_id", scheduleId)
                .select<SubscriptionWithScheduleData[]>(
                    "subscriptions.*",
                    DatabaseClient.raw("CASE WHEN schedule_data.id IS NULL THEN NULL ELSE to_jsonb(schedule_data) END as schedule_data"),
                );

            return res ?? null;

        } catch (e) {
            throw new Error(`Failed to fetch subscriptions for schedule ID ${scheduleId}.`, { cause: e });
        }
    }

    async fetch(withScheduleData: true): Promise<SubscriptionWithScheduleData[]>
    async fetch(withScheduleData?: false): Promise<SubscriptionSchema[]>
    async fetch(withScheduleData?: boolean): Promise<SubscriptionSchema[] | SubscriptionWithScheduleData[]> {
        try {
            if (withScheduleData) {
                const res = await this.db()
                    .leftJoin("schedule_data", "subscriptions.schedule_id", "schedule_data.id")
                    .where("guild_id", this.guildId)
                    .select<SubscriptionWithScheduleData[]>(
                        "subscriptions.*",
                        DatabaseClient.raw("CASE WHEN schedule_data.id IS NULL THEN NULL ELSE to_jsonb(schedule_data) END as schedule_data"),
                    );

                return res;
            }

            const res = await this.db()
                .where("guild_id", this.guildId)
                .select<SubscriptionSchema[]>("*");

            return res;
        } catch (e) {
            throw new Error(`Failed to fetch subscriptions for guild ${this.guildId}.`, { cause: e });
        }
    }

    async fetchByChannel(channelId: string, withScheduleData: true): Promise<SubscriptionWithScheduleData | null>
    async fetchByChannel(channelId: string, withScheduleData?: false): Promise<SubscriptionSchema | null>
    async fetchByChannel(channelId: string, withScheduleData?: boolean): Promise<SubscriptionSchema | SubscriptionWithScheduleData | null> {
        try {
            if (withScheduleData) {
                const res = await this.db()
                    .leftJoin("schedule_data", "subscriptions.schedule_id", "schedule_data.id")
                    .where("guild_id", this.guildId)
                    .andWhere("channel_id", channelId)
                    .select<SubscriptionWithScheduleData>(
                        "subscriptions.*",
                        DatabaseClient.raw("CASE WHEN schedule_data.id IS NULL THEN NULL ELSE to_jsonb(schedule_data) END as schedule_data"),
                    )
                    .first();

                return res ?? null;
            }

            const res = await this.db()
                .where("guild_id", this.guildId)
                .andWhere("channel_id", channelId)
                .select<SubscriptionSchema>("*")
                .first();

            return res ?? null;
        } catch (e) {
            throw new Error(`Failed to fetch subscriptions for guild ${this.guildId} and channel ${channelId}.`, { cause: e });
        }
    }

    async update(id: string, { user_id, schedule_id, mentions, is_active, channel_id }: UpdateProp): Promise<SubscriptionSchema | null> {
        mentions = JSON.stringify(mentions) as unknown as string[];

        try {
            const [res] = await this.db()
                .where("id", id)
                .andWhere("guild_id", this.guildId)
                .update({
                    user_id,
                    schedule_id,
                    mentions,
                    is_active,
                    channel_id
                })
                .returning("*");

            return res ?? null;
        } catch (e) {
            throw new Error(`Failed to update subscriptions for guild ${this.guildId}.`, { cause: e });
        }
    }

    async register({ user_id, channel_id, schedule_id, mentions }: RegisterProp): Promise<SubscriptionSchema> {
        mentions = JSON.stringify(mentions ?? []) as unknown as string[];
        try {
            const [res] = await this.db()
                .insert({
                    guild_id: this.guildId,
                    schedule_id,
                    channel_id,
                    user_id,
                    mentions
                })
                .returning("*");

            return res;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            if (e.code === "23505") { // unique violation
                if (e.constraint === "subscriptions_guild_channel_unique") {
                    throw new DuplicateSubscriptionError(this.guildId, channel_id);
                }

                if (e.constraint === "subscriptions_guild_schedule_unique") {
                    throw new DuplicateScheduleSubscriptionError(this.guildId, schedule_id);
                }
            } else if (e.code === "22P02") { // invalid text representation, likely due to mentions array not being in correct format
                throw new InvalidSubscriptionDataError("Invalid data format for subscription. Please check your input.");
            }

            // generic error fallback
            throw new Error(`Failed to register subscription for guild ${this.guildId}.`, { cause: e });
        }
    }

    async unregister(id: string): Promise<SubscriptionSchema> {
        let res;
        try {
            res = await this.db()
                .where("id", id)
                .andWhere("guild_id", this.guildId)
                .del()
                .returning("*");

        } catch (e) {
            throw new Error(`Failed to unregister subscription for guild ${this.guildId} with ID ${id}.`, { cause: e });
        }

        if (!res || res.length == 0) {
            throw new Error(`Subscription with ID ${id} couldn't be found for guild ${this.guildId}.`);
        }

        return res[0];

    }

    async enable(): Promise<SubscriptionSchema | null> {
        try {
            const [res] = await this.db()
                .where("guild_id", this.guildId)
                .update({ is_active: true })
                .returning("*");

            return res ?? null;
        } catch (e) {
            throw new Error(`Failed to enable subscription for guild ${this.guildId}.`, { cause: e });
        }
    }

    async disable(): Promise<SubscriptionSchema | null> {
        try {
            const [res] = await this.db()
                .where("guild_id", this.guildId)
                .update({ is_active: false })
                .returning("*");

            return res ?? null;
        } catch (e) {
            throw new Error(`Failed to disable subscription for guild ${this.guildId}.`, { cause: e });
        }
    }
}