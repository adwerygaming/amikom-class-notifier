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

        setInterval(() => {
            void (async (): Promise<void> => {
                await this.check(checkIntervals);
            })();
        }, 30000);

        await this.check(checkIntervals);
    }

    /**
     * Iterate the assigned check intervals and publish events if a class is confirmed 
     * on the specific offset matching the `triggerMinutes`.
     * @param triggerMinutes The offsets in minutes to look ahead (e.g. 5, 10, 15).
     */
    async check(triggerMinutes: number[]): Promise<void> {
        try {
            const now = moment().tz("Asia/Jakarta"); //.hour(6).minute(45).second(0);
            console.log(`[${tags.Job}] Now is ${now.format("HH:mm:ss")}`);

            const targetSlots = triggerMinutes.map(minutes => ({
                minutes,
                targetTimeHHmm: now.clone().add(minutes, 'minutes').format("HH:mm")
            }));
            const formattedTargetTimes = targetSlots.map(slot => slot.targetTimeHHmm);

            const pendingSchedules = await schedules.getPendingReminders(formattedTargetTimes);
            if (pendingSchedules.length === 0) {
                return;
            }

            const minutesByTargetTime = new Map(targetSlots.map(slot => [slot.targetTimeHHmm, slot.minutes]));

            for (const sch of pendingSchedules) {
                const targetTimeHHmm = sch.Waktu.slice(0, 5);
                const minutes = minutesByTargetTime.get(targetTimeHHmm);

                if (typeof minutes === "undefined") {
                    continue;
                }

                console.log(`[${tags.Job}] [${minutes}] Checking for classes starting at ${targetTimeHHmm}...`);

                const isHappeningNow = minutes === 0;

                const payload: ReminderPayload = {
                    data: sch,
                    metadata: {
                        minutesBefore: minutes,
                        isHappeningNow
                    }
                };

                await redis.publish(reminderChannelName, JSON.stringify(payload));
            }
        } catch (error) {
            console.error(`[${tags.Error}] Error occured when checking reminders:`);
            console.error(error);
        }
    }
}
