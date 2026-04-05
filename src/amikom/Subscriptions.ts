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

/**
 * Handles operations related to subscriptions.
 * Users must have an entry in the users table first since the userId references it.
 */
export class Subscriptions {
    /**
     * Retrieve the database query builder scoped to the subscriptions table.
     * @returns A Knex query builder for SubscriptionSchema.
     */
    private db(): Knex.QueryBuilder<SubscriptionSchema, SubscriptionSchema[]> {
        return DatabaseClient<SubscriptionSchema>("subscriptions");
    }

    /**
     * Add a new subscription for a user to receive notifications in a specific guild and channel.
     * Upsert using `userId` and `guildId` as unique keys.
     * @param userId The internal user ID. Must exist in the `users` table.
     * @param options.guildId Discord Guild ID
     * @param options.channelId Discord Channel ID where notifications will be sent
     * @returns SubscriptionSchema of the newly added or updated subscription.
     */
    async add(userId: string, { guildId, channelId }: AddSubscriptionProp): Promise<SubscriptionSchema> {
        //! IMPORTANT
        //! User need to fill out users table first before adding subscription.
        //! because userId is `users` table id

        try {
            const [res] = await this.db()
                .insert({
                    userId: userId, // users table id
                    channelId,
                    guildId
                })
                .onConflict(["userId", "guildId"])
                .merge({ channelId })
                .returning("*");

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to add subscription [GID: ${guildId} | CID: ${channelId} | UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to add subscription.", { cause: e });
        }
    }

    /**
     * Retrieves all subscriptions associated with a specific guild ID.
     * @param guildId The Discord Guild ID.
     * @returns An array of subscription records.
     */
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

    /**
     * Retrieves all subscriptions across all guilds for a specific user ID.
     * @param userId The internal user ID to look up.
     * @returns An array of subscription records.
     */
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

    /**
     * Remove a subscription for a user in a specific guild. This will stop the user from receiving notifications in that guild.
     * @param options.guildId Discord Guild ID
     * @param options.userId User ID
     * @returns SubscriptionSchema | null
     */
    async remove({ guildId, userId }: RemoveSubscriptionProp): Promise<SubscriptionSchema | null> {
        try {
            const res = await this.db()
                .where("guildId", guildId)
                .andWhere("userId", userId)
                .delete()
                .returning("*");

            return res.length > 0 ? res[0] : null;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to remove subscription [GID: ${guildId} | UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to remove subscription.", { cause: e });
        }
    }
}
