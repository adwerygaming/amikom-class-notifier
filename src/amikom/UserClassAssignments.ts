import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { UserClassAssignmentSchema } from "../types/Database.types.js";

interface ConstructorProps {
    userId: string
    guildId: string
}

export class UserClassAssignments {
    private readonly userId: string
    private readonly guildId: string

    constructor({ guildId, userId }: ConstructorProps) {
        this.userId = userId
        this.guildId = guildId
    }

    private db(): Knex.QueryBuilder<UserClassAssignmentSchema, UserClassAssignmentSchema[]> {
        return DatabaseClient<UserClassAssignmentSchema>("user_class_assignments")
    }

    async fetch(): Promise<UserClassAssignmentSchema | null> {
        const res = await this.db()
            .select("*")
            .where("user_id", this.userId)
            .andWhere("guild_id", this.guildId)
            .first()

        return res ?? null
    }

    async assign(scheduleId: string): Promise<UserClassAssignmentSchema> {
        const [res] = await this.db()
            .insert({
                user_id: this.userId,
                guild_id: this.guildId,
                schedule_id: scheduleId
            })
            .onConflict(["user_id", "guild_id"])
            .merge({ schedule_id: scheduleId })
            .returning("*")

        return res
    }
}