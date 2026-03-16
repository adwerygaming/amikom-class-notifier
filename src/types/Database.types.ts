import { type ClassSchedule } from "./Amikom.types.js";

export interface BaseDatabaseSchema {
    id: string;
    created_at: string;
    last_modified: string;
}

export interface SubscriptionSchema extends BaseDatabaseSchema {
    schedule_id: string
    guild_id: string
    channel_id: string
    user_id: string
    mentions: string[] | null
    is_active: boolean
}

export interface UserClassAssignmentSchema extends BaseDatabaseSchema {
    user_id: string
    guild_id: string
    schedule_id: string
}

export interface ScheduleDataSchema extends BaseDatabaseSchema {
    major: string;
    entry_year: number;
    class_number: number;
    schedule: ClassSchedule[];
}

export interface SubscriptionWithScheduleData extends SubscriptionSchema {
    schedule_data: ScheduleDataSchema | null
}

export interface DatabaseTables {
    subscriptions: SubscriptionSchema,
    schedule_data: ScheduleDataSchema,
    user_class_assignments: UserClassAssignmentSchema
}