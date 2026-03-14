import moment from "moment-timezone"
// @ts-expect-error moment locale lacks type declarations but is needed for Indonesian day names
import "moment/locale/id.js"
import redisClient from "../database/RedisClient.js"
import { ReminderEvent } from "../types/ACN.types.js"
import tags from "../utils/Tags.js"
import { Amikom } from "./Amikom.js"

const amikom = new Amikom()

interface ReminderConfig {
    intervalSeconds: number
}

export class Reminder {
    private readonly state = redisClient.duplicate()
    private readonly pub = redisClient.duplicate()

    private convertStringTimeToMoment(time: string): moment.Moment {
        const [hour, minute] = time.split(":").map(Number)
        return moment().tz("Asia/Jakarta").set({ hour, minute, second: 0, millisecond: 0 })
    }

    private getTodayDateKey(): string {
        return moment().tz("Asia/Jakarta").format("YYYY-MM-DD")
    }

    private async getState(event: ReminderEvent, classCode: string): Promise<boolean> {
        const todayDateKey = this.getTodayDateKey()
        const key = `reminder:${todayDateKey}:${classCode}:${event}`

        const value = await this.state.get(key)
        return !!value
    }

    private async setState(event: ReminderEvent, classCode: string, value: boolean): Promise<void> {
        const todayDateKey = this.getTodayDateKey()
        const key = `reminder:${todayDateKey}:${classCode}:${event}`

        // 24h expiration to prevent stale data and duplicate notifications.
        await this.state.setex(key, 60 * 60 * 24, value.toString())
    }

    async start({ intervalSeconds }: ReminderConfig): Promise<void> {
        const INTERVAL = intervalSeconds || 5

        console.log(`[${tags.Reminder}] Reminder service started. Checking schedule every ${INTERVAL} seconds.`)
        
        setInterval(() => void this.check(), INTERVAL * 1000)
    }

    private async check(): Promise<void> {
        try {
            const now = moment().tz("Asia/Jakarta")
            const schedule = await amikom.readSchedule()

            const today = now.locale("id").format("dddd").toUpperCase()
            const todaySchedule = schedule.filter(s => s.Hari.toUpperCase() === today)

            if (todaySchedule?.length == 0) {
                console.log(`[${tags.Reminder}] Today is ${today}, but there are no classes scheduled.`)
                return
            }

            for (const schedule of todaySchedule) {
                const classTime = this.convertStringTimeToMoment(schedule.Waktu)
                const diff = classTime.diff(now, "minutes")

                // what? DRY? who cares?
                // Waguri-san: i care about you :3 *nyah*

                const hasNotifyStartingNow = await this.getState(ReminderEvent.StartingNow, schedule.Kode)
                if (diff === 0 && !hasNotifyStartingNow) {
                    console.log(`[${tags.Reminder}] Sending starting now reminder event.`)
                    this.pub.publish(ReminderEvent.StartingNow, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.StartingNow, schedule.Kode, true)
                }

                const hasNotifyIn5Minutes = await this.getState(ReminderEvent.In5Minutes, schedule.Kode)
                if (diff === 5 && !hasNotifyIn5Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 5 minutes reminder event.`)
                    this.pub.publish(ReminderEvent.In5Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In5Minutes, schedule.Kode, true)
                }

                const hasNotifyIn10Minutes = await this.getState(ReminderEvent.In10Minutes, schedule.Kode)
                if (diff === 10 && !hasNotifyIn10Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 10 minutes reminder event.`)
                    this.pub.publish(ReminderEvent.In10Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In10Minutes, schedule.Kode, true)
                }

                const hasNotifyIn15Minutes = await this.getState(ReminderEvent.In15Minutes, schedule.Kode)
                if (diff === 15 && !hasNotifyIn15Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 15 minutes reminder event.`)
                    this.pub.publish(ReminderEvent.In15Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In15Minutes, schedule.Kode, true)
                }

                const hasNotifyIn30Minutes = await this.getState(ReminderEvent.In30Minutes, schedule.Kode)
                if (diff === 30 && !hasNotifyIn30Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 30 minutes reminder event.`)
                    this.pub.publish(ReminderEvent.In30Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In30Minutes, schedule.Kode, true)
                }

                const hasNotifyIn1Hour = await this.getState(ReminderEvent.In1Hour, schedule.Kode)
                if (diff === 60 && !hasNotifyIn1Hour) {
                    console.log(`[${tags.Reminder}] Sending in 1 hour reminder event.`)
                    this.pub.publish(ReminderEvent.In1Hour, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In1Hour, schedule.Kode, true)
                }
            }
        } catch (e) {
            console.error("Error occurred while checking schedule:", e)
        }
    }
}