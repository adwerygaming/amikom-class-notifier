import { Knex } from "knex";
import moment from "moment-timezone";
import DatabaseClient from "../database/Client.js";
import redisClient from "../database/RedisClient.js";
import { ClassSchedule } from "../types/Amikom.types.js";
import { ScheduleSchema, SubscriptionSchema, UserSchema } from "../types/Database.types.js";
import tags from "../utils/Tags.js";

export interface GetAllSchedulesResult extends ScheduleSchema {
    user: UserSchema
    subscriptions: SubscriptionSchema[]
}

export interface StateProp {
    /**
     * Event name
     * @example "reminder_5" // for 5 minutes before reminder
     * @example "reminder_10" // for 10 minutes before reminder
     */
    eventName: string;

    /**
     * User ID (Not Discord ID)
     * @example "123e4567-e89b-12d3-a456-426614174000"
     */
    userId: string;

    /**
     * That 1 row schedule ID that you want to set the state for.
     * @example "123e4567-e89b-12d3-a456-426614174000"
     */
    scheduleId: string;

    /**
     * Discord Guild ID
     * @example "598412465750933504"
     */
    guildId: string; 
}

const redis = redisClient.duplicate();

export class Schedules {
    private db(): Knex.QueryBuilder<ScheduleSchema, ScheduleSchema[]> {
        return DatabaseClient<ScheduleSchema>("schedules");
    }

    /**
     * Sets the state for a specific reminder event and schedule.
     * @param options.eventName Event name
     * @param options.userId User ID (Not Discord ID)
     * @param options.scheduleId That 1 row schedule ID that you want to set the state for.
     * @param value The boolean value to set the state to.
     * @returns void
     */
    async setState({ eventName, userId, scheduleId, guildId }: StateProp, value: boolean): Promise<void> {
        // you want to set this at least as long as 1 class could be. usually 1h 40m, 
        const ttlSeconds = 60 * 60 * 2; // 2 hours just to be safe

        const key = `reminderState:${guildId}:${userId}:${eventName}:${scheduleId}`;
        await redis.setex(key, ttlSeconds, value ? "true" : "false");
    }

    /**
     * Gets the state for a specific reminder event and schedule.
     * @param options.eventName Event name
     * @param options.userId User ID (Not Discord ID)
     * @param options.scheduleId That 1 row schedule ID that you want to get the state for.
     * @returns Promise<boolean> The boolean value representing the state.
     */
    async getState({ eventName, userId, scheduleId, guildId }: StateProp): Promise<boolean> {
        const key = `reminderState:${guildId}:${userId}:${eventName}:${scheduleId}`;
        const value = await redis.get(key);
        return value === "true";
    }

    /**
     * Fetches all today schedules across all users
     * @param targetTime HH:mm format 
     * @returns GetAllSchedulesResult
     */
    async getPendingReminders(targetTime: string): Promise<GetAllSchedulesResult[]> {
        try {
            const currentDay = moment().tz("Asia/Jakarta").locale("id").format("dddd").toUpperCase();
            const res = await this.db()
                .where("schedules.Hari", currentDay)
                .andWhere("schedules.Waktu", "like", `${targetTime}-%`)
                .andWhere("schedules.isActive", true)
                .join("users", "schedules.userId", "users.id")
                .leftJoin("subscriptions", "subscriptions.userId", "users.id")
                .groupBy("schedules.id", "users.id")
                .select<GetAllSchedulesResult[]>(
                    // whole schedules
                    "schedules.*",
                    // whole user
                    DatabaseClient.raw(`row_to_json(users) as user`),
                    // all subscriptions of the user, if no subscription then return empty array
                    DatabaseClient.raw(`COALESCE(json_agg(subscriptions) FILTER (WHERE subscriptions.id IS NOT NULL), '[]') as subscriptions`)
                );

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to fetch all schedules`);
            console.error(e);
            throw new Error("Failed to fetch all schedules.", { cause: e });
        }
    }

    /**
     * Fetches all schedules for a given user ID
     * @param userId Users ID (Not Discord ID)
     * @returns {ScheduleSchema[]} An array of schedule data associated with the user ID.
     */
    async getByUserId(userId: string): Promise<ScheduleSchema[]> {
        try {
            const res = await this.db()
                .select("*")
                .where("userId", userId);

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to fetch schedules by user id [UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to fetch schedules by user id.", { cause: e });
        }
    }

    /**
     * Sets the schedule for a given user ID
     * @param userId Users ID (Not Discord ID)
     * @param schedule Schedule data to be set for the user.
     * @returns {ScheduleSchema[]} The inserted schedule data after being set.
     */
    async set(userId: string, schedule: ClassSchedule[]): Promise<ScheduleSchema[]> {
        try {
            const res = await DatabaseClient.transaction(async trx => {
                // delete
                await this.db()
                    .transacting(trx)
                    .where("userId", userId)
                    .delete();

                const res = await this.db()
                    .transacting(trx)
                    .insert(schedule.map((x) => ({ ...x, userId })))
                    .returning("*");

                return res;
            });

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to set schedule to a user [UID: ${userId}]`);
            console.error(`[${tags.Error}] Schedule: ${typeof schedule}, has ${schedule?.length} items.`);
            console.error(e);
            throw new Error("Failed to set schedule to a user.", { cause: e });
        }
    }
}
