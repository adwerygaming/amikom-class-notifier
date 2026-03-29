import { type ClassSchedule } from "./Amikom.types.js";

export interface BaseDatabaseSchema {
    id: string;
    createdAt: string;
    lastModified: string;
}

export interface SubscriptionSchema extends BaseDatabaseSchema {
    guildId: string;
    channelId: string;
    userId: string;
    mentions: boolean;
}

export interface UserSchema extends BaseDatabaseSchema {
    userId: string;
    major: string;
    entry_year: number;
    class_number: number;
}

type BaseScheduleSchema = BaseDatabaseSchema & ClassSchedule

export interface ScheduleSchema extends BaseScheduleSchema {
  userId: string;
  isActive: boolean;
}

export interface DatabaseTables {
    subscriptions: SubscriptionSchema,
    users: UserSchema
    schedules: ScheduleSchema
}