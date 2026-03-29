import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { SubscriptionSchema } from "../types/Database.types.js";
import tags from "../utils/Tags.js";

interface AddSubscriptionProp {
    guildId: string
    channelId: string
    userId: string
}

interface RemoveSubscriptionProp {
    guildId: string
    channelId: string
}

export class Subscriptions {
    constructor(
        private readonly userId: string
    ) { }

    private db(): Knex.QueryBuilder<SubscriptionSchema, SubscriptionSchema[]> {
        return DatabaseClient<SubscriptionSchema>("subscriptions");
    }

    async add({ guildId, channelId, userId }: AddSubscriptionProp): Promise<SubscriptionSchema> {
        //! IMPORTANT
        // User need to fill out users table first before adding subscription.
        // because userId is `users` table id

        try {
            const [res] = await this.db()
                .insert({
                    userId, // users table id
                    channelId,
                    guildId
                })
                .returning("*");

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to add subscription [GID: ${guildId} | CID: ${channelId} | UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to add subscription.", { cause: e });
        }
    }

    async getByUserId(): Promise<SubscriptionSchema> {
        try {
            const [res] = await this.db()
                .where("userId", this.userId)
                .select("*");

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get subscriptions by user id [UID: ${this.userId}]`);
            console.error(e);
            throw new Error("Failed to get subscriptions by user id.", { cause: e });
        }
    }

    async remove({ guildId, channelId }: RemoveSubscriptionProp): Promise<SubscriptionSchema | null> {
        try {
            const [res] = await this.db()
                .where("guildId", guildId)
                .andWhere("channelId", channelId)
                .delete()
                .returning("*");

            return res ?? null;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to remove subscription [GID: ${guildId} | CID: ${channelId}]`);
            console.error(e);
            throw new Error("Failed to remove subscription.", { cause: e });
        }
    }
}