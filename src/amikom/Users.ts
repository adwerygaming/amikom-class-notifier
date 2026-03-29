import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { UserSchema } from "../types/Database.types.js";
import tags from "../utils/Tags.js";

interface AssignClassProp {
    major: string;
    entry_year: number;
    class_number: number;
}

export class Users {
    private db(): Knex.QueryBuilder<UserSchema, UserSchema[]> {
        return DatabaseClient<UserSchema>("users");
    }

    async getById(userId: string): Promise<UserSchema> {
        try {
            const [res] = await this.db()
                .select("*")
                .where("userId", userId);

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to get user data by user id [UID: ${userId}]`);
            console.error(e);
            throw new Error("Failed to get user data by user id.", { cause: e });
        }
    }

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

            return res;
        } catch (e) {
            console.error(`[${tags.Error}] Failed to assign user to a class [UID: ${userId} | Major: ${major} | Entry Year: ${entry_year} | Class Number: ${class_number}]`);
            console.error(e);
            throw new Error("Failed to assign user to a class.", { cause: e });
        }
    }
}