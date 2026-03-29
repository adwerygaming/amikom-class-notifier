import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { SubscriptionSchema } from "../types/Database.types.js";
import tags from "../utils/Tags.js";

interface AddSubscriptionProp {
    guildId: string
    channelId: string
}

interface RemoveSubscriptionProp {
    userId: string
    guildId: string
}

export class Subscriptions {
    private db(): Knex.QueryBuilder<SubscriptionSchema, SubscriptionSchema[]> {
        return DatabaseClient<SubscriptionSchema>("subscriptions");
    }

    async add(userId: string, { guildId, channelId }: AddSubscriptionProp): Promise<SubscriptionSchema> {
        //! IMPORTANT
        // User need to fill out users table first before adding subscription.
        // because userId is `users` table id

        try {
            const [res] = await this.db()
                .insert({
                    userId: userId, // users table id
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

    async getByGuildId(guildId: string): Promise<SubscriptionSchema[]> {
        try {
            const res = await this.db()
                .where("guildId", guildId)
                .select("*");

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get subscriptions by guild id [GID: ${guildId}]`);
            console.error(e);
            throw new Error("Failed to get subscriptions by guild id.", { cause: e });
        }
    }

    async getByUserId(userId: string): Promise<SubscriptionSchema[]> {
        try {
            const res = await this.db()
                .where("userId", userId)
                .select("*");

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get subscriptions by user id [UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to get subscriptions by user id.", { cause: e });
        }
    }

    async remove({ guildId, userId }: RemoveSubscriptionProp): Promise<SubscriptionSchema | null> {
        try {
            const [res] = await this.db()
                .where("guildId", guildId)
                .andWhere("userId", userId)
                .delete()
                .returning("*");

            return res ?? null;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to remove subscription [GID: ${guildId} | UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to remove subscription.", { cause: e });
        }
    }
}