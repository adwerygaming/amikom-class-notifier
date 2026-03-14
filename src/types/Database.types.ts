export interface BaseDatabaseSchema {
    id: string;
    created_at: string;
    last_modified: string;
}

export interface SubscriptionSchema extends BaseDatabaseSchema {
    guild_id: string
    channel_id: string
    author_id: string
    mentions: string[] | null
    is_active: boolean
}

export interface DatabaseTables {
    subscriptions: SubscriptionSchema
}