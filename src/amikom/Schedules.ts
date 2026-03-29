import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { ScheduleSchema } from "../types/Database.types.js";
import tags from "../utils/Tags.js";

export class Schedules {
    private db(): Knex.QueryBuilder<ScheduleSchema, ScheduleSchema[]> {
        return DatabaseClient<ScheduleSchema>("schedules");
    }

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
}