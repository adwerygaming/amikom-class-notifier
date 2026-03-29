import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { ScheduleSchema } from "../types/Database.types.js";

export class Schedules {
    private db(): Knex.QueryBuilder<ScheduleSchema, ScheduleSchema[]> {
        return DatabaseClient<ScheduleSchema>("schedules");
    }
}