import moment from "moment-timezone";
import redisClient from "../database/RedisClient.js";
import tags from "../utils/Tags.js";
import { GetAllSchedulesResult, Schedules } from "./Schedules.js";

const schedules = new Schedules();

interface StartProp {
    checkIntervals: number[]
}

export const reminderChannelName = "schedule_reminder";
const redis = redisClient.duplicate();

export type ReminderPayload = {
    data: GetAllSchedulesResult,
    metadata: ReminderMetadata
}

type ReminderMetadata = {
    minutesBefore: number;
    isHappeningNow: boolean;
}

export class Reminder {
    async start({ checkIntervals }: StartProp): Promise<void> {
        console.log(`[${tags.Reminder}] Reminder service started.`);
        console.log(`[${tags.Reminder}] Checking intervals: ${checkIntervals.join(", ")} minutes.`);

        setInterval(async () => {
            await this.check(checkIntervals);
        }, 30000);

        await this.check(checkIntervals);
    }

    async check(triggerMinutes: number[]): Promise<void> {
        try {
            const now = moment().tz("Asia/Jakarta"); //.hour(6).minute(45).second(0);
            console.log(`[${tags.Job}] Now is ${now.format("HH:mm:ss")}`);
            
            for (const minutes of triggerMinutes) {
                const targetMoment = now.add(minutes, 'minutes');
                const targetTimeHHmm = targetMoment.format("HH:mm");

                console.log(`[${tags.Job}] [${minutes}] Checking for classes starting at ${targetTimeHHmm}...`);

                const pendingSchedules = await schedules.getPendingReminders(targetTimeHHmm);
                if (pendingSchedules.length === 0) {
                    // console.log(`[${tags.Job}] [${minutes}] nothing.`);
                    continue;
                }

                for (const sch of pendingSchedules) {
                    const { user, subscriptions } = sch;

                    for (const sub of subscriptions) {
                        const isHappeningNow = minutes === 0;

                        const payload: ReminderPayload = {
                            data: sch,
                            metadata: {
                                minutesBefore: minutes,
                                isHappeningNow
                            }
                        };

                        await redis.publish(reminderChannelName, JSON.stringify(payload));

                        console.log(`[${tags.Job}] Dispatch -> Channel: ${sub.channelId} | User: ${user.userId}`);
                    }
                }
            }
        } catch (error) {
            console.error(`[${tags.Error}] Error occured when checking reminders:`);
            console.error(error);
        }
    }
}
