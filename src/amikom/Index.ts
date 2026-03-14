import redisClient from "../database/RedisClient.js";
import { ReminderEvent } from "../types/ACN.types.js";
import { ClassSchedule } from "../types/Amikom.types.js";

const sub = redisClient.duplicate()

async function start(): Promise<void> {
    await sub.subscribe(
        ReminderEvent.StartingNow,
        ReminderEvent.In5Minutes,
        ReminderEvent.In10Minutes,
        ReminderEvent.In15Minutes,
        ReminderEvent.In30Minutes,
        ReminderEvent.In1Hour,
    )

    sub.on("message", (channel, message) => {
        const schedule = JSON.parse(message) as ClassSchedule

        if (channel === ReminderEvent.StartingNow) {
            console.log(`[${channel}] Class "${schedule.MataKuliah}" is starting now!`)
        } else if (channel === ReminderEvent.In5Minutes) {
            console.log(`[${channel}] Class "${schedule.MataKuliah}" will start in 5 minutes!`)
        } else if (channel === ReminderEvent.In10Minutes) {
            console.log(`[${channel}] Class "${schedule.MataKuliah}" will start in 10 minutes!`)
        } else if (channel === ReminderEvent.In15Minutes) {
            console.log(`[${channel}] Class "${schedule.MataKuliah}" will start in 15 minutes!`)
        } else if (channel === ReminderEvent.In30Minutes) {
            console.log(`[${channel}] Class "${schedule.MataKuliah}" will start in 30 minutes!`)
        } else if (channel === ReminderEvent.In1Hour) {
            console.log(`[${channel}] Class "${schedule.MataKuliah}" will start in 1 hour!`)
        }
    })
}

start().catch((err) => {
    console.error("Failed to start reminder subscriber:", err)
})