import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { ScheduleSchema, UserSchema } from "../types/Database.types.js";
import tags from "../utils/Tags.js";

interface AssignClassProp {
    major: string;
    entry_year: number;
    class_number: number;
}

interface GetByUserIdWithScheduleResult extends UserSchema {
    schedules: ScheduleSchema[]
}

export class Users {
    private db(): Knex.QueryBuilder<UserSchema, UserSchema[]> {
        return DatabaseClient<UserSchema>("users");
    }

    /**
     * Fetches user data by user ID
     * @param id User ID (Not Discord ID)
     * @returns {UserSchema | null} User data associated with the user ID, or null if not found.
     */
    async getById(id: string): Promise<UserSchema | null> {
        try {
            const res = await this.db()
                .select("*")
                .where("id", id)
                .first();

            return res ?? null;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get user data by id [ID: ${id}]`);
            console.error(e);
            throw new Error("Failed to get user data by id.", { cause: e });
        }
    }

    /**
     * Fetches user data along with their schedules by user ID
     * @param id User ID (Not Discord ID)
     * @returns {GetByUserIdWithScheduleResult | null} User data along with their schedules, or null if not found.
     */
    async getByIdWithSchedule(id: string): Promise<GetByUserIdWithScheduleResult | null> {
        try {
            // TODO: optimize this into single query later.
            const user = await this.db()
                .where("id", id)
                .select("*")
                .first();

            if (!user) return null;

            const schedules = await DatabaseClient<ScheduleSchema>("schedules")
                .select("*")
                .where("userId", user.id);

            const res = {
                ...user,
                schedules
            };

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get user data by user id with schedule [ID: ${id}]`);
            console.error(e);
            throw new Error("Failed to get user data by user id with schedule.", { cause: e });
        }
    }

    /**
     * Fetches user data by Discord user ID
     * @param userId Discord User ID
     * @returns {UserSchema | null} User data associated with the Discord user ID, or null if not found.
     */
    async getByDiscordId(userId: string): Promise<UserSchema | null> {
        try {
            const res = await this.db()
                .select("*")
                .where("userId", userId)
                .first();

            return res ?? null;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get user data by discord user id [UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to get user data by discord user id.", { cause: e });
        }
    }

    /**
     * Fetches user data along with their schedules by Discord user ID
     * @param userId Discord User ID
     * @returns {GetByUserIdWithScheduleResult | null} User data along with their schedules, or null if not found.
     */
    async getByDiscordIdWithSchedule(userId: string): Promise<GetByUserIdWithScheduleResult | null> {
        try {
            // TODO: optimize this into single query later.
            const user = await this.db()
                .where("userId", userId)
                .select("*")
                .first();

            if (!user) return null;

            const schedules = await DatabaseClient<ScheduleSchema>("schedules")
                .select("*")
                .where("userId", user.id);

            const res = {
                ...user,
                schedules
            };

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get user data by discord user id with schedule [UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to get user data by discord user id with schedule.", { cause: e });
        }
    }

    /**
     * Assign Discord User's Class Information
     * @param userId Discord User ID
     * @param options.major string
     * @param options.entry_year number
     * @param options.class_number number
     * @returns {UserSchema} The updated user data
     */
    async assignClass(userId: string, { major, entry_year, class_number }: AssignClassProp): Promise<UserSchema> {
        try {
            const [res] = await this.db()
                .insert({
                    userId, // discord id
                    class_number,
                    major,
                    entry_year,
                })
                .onConflict("userId")
                .merge(["major", "entry_year", "class_number"])
                .returning("*");

            if (!res) {
                throw new Error("Failed to assign class to user.", { cause: "there is conflict. good luck." });
            }

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to assign user to a class [UID: ${userId} | Major: ${major} | Entry Year: ${entry_year} | Class Number: ${class_number}]`);
            console.error(e);
            throw new Error("Failed to assign user to a class.", { cause: e });
        }
    }
}
