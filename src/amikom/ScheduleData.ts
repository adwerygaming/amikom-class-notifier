import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { ScheduleDataSchema } from "../types/Database.types.js";

type SetProp = Omit<ScheduleDataSchema, "id" | "created_at" | "last_modified">;

type GetByIdProp = Pick<ScheduleDataSchema, "id">;

type GetByInfoProp = Omit<ScheduleDataSchema, "id" | "created_at" | "last_modified" | "schedule">;

type UpdateProp = Pick<ScheduleDataSchema, "class_number" | "major" | "entry_year" | "schedule"> & Pick<ScheduleDataSchema, "id">;

type DeleteProp = Pick<ScheduleDataSchema, "id">;

export class ScheduleData {
    private db(): Knex.QueryBuilder<ScheduleDataSchema, ScheduleDataSchema[]> {
        return DatabaseClient<ScheduleDataSchema>("schedule_data")
    }

    async set({ major, entry_year, class_number, schedule }: SetProp): Promise<ScheduleDataSchema> {
        const [res] = await this.db()
            .insert({
                major,
                class_number,
                entry_year,
                schedule
            })
            .onConflict(["major", "entry_year", "class_number"])
            .merge({ schedule })
            .returning("*")

        return res
    }

    async getById({ id }: GetByIdProp): Promise<ScheduleDataSchema | null> {
        const res = await this.db()
            .select("*")
            .where("id", id)
            .first()

        return res ?? null

    }

    async getByInfo({ major, entry_year, class_number }: GetByInfoProp): Promise<ScheduleDataSchema | null> {
        const res = await this.db()
            .select("*")
            .where("major", major)
            .andWhere("entry_year", entry_year)
            .andWhere("class_number", class_number)
            .first()

        return res ?? null
    }

    async update({ id, class_number, entry_year, major, schedule }: UpdateProp): Promise<ScheduleDataSchema | null> {
        const [res] = await this.db()
            .where("id", id)
            .update({
                class_number,
                entry_year,
                major,
                schedule
            })
            .returning("*")

        return res ?? null
    }

    async delete({ id }: DeleteProp): Promise<ScheduleDataSchema | null> {
        const res = await this.db()
            .where("id", id)
            .delete()
            .returning("*")
            .first()

        return res ?? null
    }
}