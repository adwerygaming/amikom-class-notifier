import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { UserSchema } from "../types/Database.types.js";

export class Users {
    private db(): Knex.QueryBuilder<UserSchema, UserSchema[]> {
        return DatabaseClient<UserSchema>("users");
    }
}