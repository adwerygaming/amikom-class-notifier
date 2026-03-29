import { Knex } from "knex";
import DatabaseClient from "../database/Client.js";
import { SubscriptionSchema } from "../types/Database.types.js";

export class Subscriptions {
    constructor(
        private readonly userId: string
    ) { }

    private db(): Knex.QueryBuilder<SubscriptionSchema, SubscriptionSchema[]> {
        return DatabaseClient<SubscriptionSchema>("subscriptions");
    }
}