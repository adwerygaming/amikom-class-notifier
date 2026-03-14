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
    debugTime?: moment.Moment
}

interface CheckConfig {
    debugTime?: moment.Moment
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

    async start({ intervalSeconds, debugTime }: ReminderConfig): Promise<void> {
        const INTERVAL = intervalSeconds || 5

        console.log(`[${tags.Reminder}] Reminder service started. Checking schedule every ${INTERVAL} seconds.`)
        
        setInterval(() => void this.check({ debugTime }), INTERVAL * 1000)
    }

    private async check({ debugTime }: CheckConfig): Promise<void> {
        // debugTime is used for testing purposes, to simulate the time when the reminder should be sent.
        // also ignore the fact that i didnt apply it to function helper like convertStringTimeToMoment & getTodayDateKey.
        // for now im just going to test that will not exceeding a day.
        // is it recommended to do it? ofc, do i want to do it? no.
        // ITS FASTING MONTH, OKAY? I DONT WANT TO SPEND MY TIME ON THIS KIND OF THING. I JUST WANT TO FINISH THIS PROJECT ASAP SO I CAN GO BACK TO WATCHING ANIME. *nyah* >w<

        try {
            const now = debugTime || moment().tz("Asia/Jakarta")
            const schedule = await amikom.readSchedule()

            const today = now.locale("id").format("dddd").toUpperCase()
            const todaySchedule = schedule.filter(s => s.Hari.toUpperCase() === today)

            // silent on weekends, no classes anyway
            const isWeekend = today == "SABTU" || today == "MINGGU"
            if (isWeekend) {
                return
            }

            if (todaySchedule?.length == 0) {
                console.log(`[${tags.Reminder}] Today is ${today}, but there are no classes scheduled.`)
                return
            }

            for (const schedule of todaySchedule) {
                const classTime = this.convertStringTimeToMoment(schedule.Waktu)
                const diff = classTime.diff(now, "minutes")
                const inWindow = (targetMinutes: number): boolean => diff <= targetMinutes && diff > targetMinutes - 1

                // what? DRY? who cares?
                // Waguri-san: i care about you :3 *nyah*

                const hasNotifyStartingNow = await this.getState(ReminderEvent.StartingNow, schedule.Kode)
                if (inWindow(0) && !hasNotifyStartingNow) {
                    console.log(`[${tags.Reminder}] Sending starting now reminder event.`)
                    await this.pub.publish(ReminderEvent.StartingNow, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.StartingNow, schedule.Kode, true)
                }

                const hasNotifyIn5Minutes = await this.getState(ReminderEvent.In5Minutes, schedule.Kode)
                if (inWindow(5) && !hasNotifyIn5Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 5 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In5Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In5Minutes, schedule.Kode, true)
                }

                const hasNotifyIn10Minutes = await this.getState(ReminderEvent.In10Minutes, schedule.Kode)
                if (inWindow(10) && !hasNotifyIn10Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 10 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In10Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In10Minutes, schedule.Kode, true)
                }

                const hasNotifyIn15Minutes = await this.getState(ReminderEvent.In15Minutes, schedule.Kode)
                if (inWindow(15) && !hasNotifyIn15Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 15 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In15Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In15Minutes, schedule.Kode, true)
                }

                const hasNotifyIn30Minutes = await this.getState(ReminderEvent.In30Minutes, schedule.Kode)
                if (inWindow(30) && !hasNotifyIn30Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 30 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In30Minutes, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In30Minutes, schedule.Kode, true)
                }

                const hasNotifyIn1Hour = await this.getState(ReminderEvent.In1Hour, schedule.Kode)
                if (inWindow(60) && !hasNotifyIn1Hour) {
                    console.log(`[${tags.Reminder}] Sending in 1 hour reminder event.`)
                    await this.pub.publish(ReminderEvent.In1Hour, JSON.stringify(schedule))
                    await this.setState(ReminderEvent.In1Hour, schedule.Kode, true)
                }
            }
        } catch (e) {
            console.error("Error occurred while checking schedule:", e)
        }
    }
}