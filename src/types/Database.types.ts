import { ClassSchedule } from "./Amikom.types.js";

export interface BaseDatabaseSchema {
    id: string;
    created_at: string;
    last_modified: string;
}

export interface SubscriptionSchema extends BaseDatabaseSchema {
    schedule_id: string
    guild_id: string
    channel_id: string
    author_id: string
    mentions: string[] | null
    is_active: boolean
}

export interface ScheduleDataSchema extends BaseDatabaseSchema {
    major: string;
    entry_year: number;
    class_number: string;
    schedule: ClassSchedule[];
}

export interface DatabaseTables {
    subscriptions: SubscriptionSchema,
    schedule_data: ScheduleDataSchema
}