import moment from "moment-timezone"
// @ts-expect-error moment locale lacks type declarations but is needed for Indonesian day names
import "moment/locale/id.js"
import redisClient from "../database/RedisClient.js"
import { ReminderEvent } from "../types/ACN.types.js"
import { ClassSchedule } from "../types/Amikom.types.js"
import tags from "../utils/Tags.js"
import { Amikom } from "./Amikom.js"
import { Helper } from "./Helper.js"

const amikom = new Amikom()
const helper = new Helper()

interface ReminderConfig {
    intervalSeconds: number
    debugTime?: moment.Moment
}

interface CheckConfig {
    debugTime?: moment.Moment
}

interface StateConfig {
    event: ReminderEvent
    classCode: string
    classPeriod: number
}

export interface CheckReminderResponse {
    schedule: ClassSchedule
    nextSchedule: ClassSchedule | null
}

export class Reminder {
    private readonly state = redisClient.duplicate()
    private readonly pub = redisClient.duplicate()

    private async getState({ event, classCode, classPeriod }: StateConfig): Promise<boolean> {
        const todayDateKey = helper.getTodayDateKey()
        const key = `reminder:${todayDateKey}:${classCode}:${classPeriod}:${event}`

        const value = await this.state.get(key)
        return !!value
    }

    private async setState({ event, classCode, classPeriod }: StateConfig, value: boolean): Promise<void> {
        const todayDateKey = helper.getTodayDateKey()
        const key = `reminder:${todayDateKey}:${classCode}:${classPeriod}:${event}`

        console.log(`[${tags.Debug}] Setting state for key ${key} to ${value}`)

        // 24h expiration to prevent stale data and duplicate notifications.
        await this.state.setex(key, 60 * 60 * 24, value.toString())
    }

    async start({ intervalSeconds, debugTime }: ReminderConfig): Promise<void> {
        const INTERVAL = intervalSeconds || 5

        console.log(`[${tags.Reminder}] Reminder service started. Checking schedule every ${INTERVAL} seconds.`)

        // const time = debugTime || moment().tz("Asia/Jakarta")
        
        setInterval(() => void this.check({ debugTime }), INTERVAL * 1000)
    }

    private async check({ debugTime }: CheckConfig): Promise<void> {
        try {
            const now = debugTime || moment().tz("Asia/Jakarta")
            const schedule = await amikom.readSchedule()

            console.log(`[${tags.Debug}] Right now is ${now.format("HH:mm:ss - dddd, DD MMM YYYY")}`)

            const today = now.locale("id").format("dddd").toUpperCase()
            const todaySchedule = schedule.filter(s => s.Hari.toUpperCase() === today)

            // silent on weekends, no classes anyway
            const isWeekend = today == "SABTU" || today == "MINGGU"
            if (isWeekend) {
                return
            }

            if (todaySchedule?.length == 0) {
                // console.log(`[${tags.Reminder}] Today is ${today}, but there are no classes scheduled.`)
                return
            }

            // const currentSchedule = todaySchedule.find((schedule) => {
            //     const { start, end } = helper.resolveClassTime(schedule.Waktu)
            //     return now.isBetween(start, end)
            // }) ?? null

            const nextSchedule = todaySchedule.find((schedule) => {
                const { start } = helper.resolveClassTime(now, schedule.Waktu)
                return start.isAfter(now)
            }) ?? null

            // debug
            // if (nextSchedule) {
            //     const { start } = helper.resolveClassTime(now, nextSchedule.Waktu)
            //     const diff = start.diff(now, "minutes")
            //     console.log(`[${tags.Debug}] Next class in ${diff} minutes`)
            //     console.log(`[${tags.Debug}] ${nextSchedule.MataKuliah} at ${start.format("HH:mm")}`)
            // }

            for (const schedule of todaySchedule) {
                // there is also endTime, you can implement endInX events if u want.
                const { start: startTime } = helper.resolveClassTime(now, schedule.Waktu)
                const diff = startTime.diff(now, "minutes")

                const classCode = schedule.Kode
                const classPeriod = schedule.IdJam
                
                const stateConfig: StateConfig = {
                    classCode,
                    classPeriod,
                    event: ReminderEvent.StartingNow
                }

                const response: CheckReminderResponse = {
                    schedule: schedule,
                    nextSchedule
                }

                // what? DRY? who cares?

                const hasNotifyStartingNow = await this.getState(stateConfig)
                if (diff >= -5 && diff <= 0 && !hasNotifyStartingNow) {
                    console.log(`[${tags.Reminder}] Sending starting now reminder event.`)
                    await this.pub.publish(ReminderEvent.StartingNow, JSON.stringify(response))
                    await this.setState(stateConfig, true)
                }

                const hasNotifyIn5Minutes = await this.getState({...stateConfig, event: ReminderEvent.In5Minutes})
                if (diff >= 1 && diff <= 5 && !hasNotifyIn5Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 5 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In5Minutes, JSON.stringify(response))
                    await this.setState({...stateConfig, event: ReminderEvent.In5Minutes}, true)
                }

                const hasNotifyIn10Minutes = await this.getState({...stateConfig, event: ReminderEvent.In10Minutes})
                if (diff >= 6 && diff <= 10 && !hasNotifyIn10Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 10 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In10Minutes, JSON.stringify(response))
                    await this.setState({...stateConfig, event: ReminderEvent.In10Minutes}, true)
                }

                const hasNotifyIn15Minutes = await this.getState({...stateConfig, event: ReminderEvent.In15Minutes})
                if (diff >= 11 && diff <= 15 && !hasNotifyIn15Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 15 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In15Minutes, JSON.stringify(response))
                    await this.setState({...stateConfig, event: ReminderEvent.In15Minutes}, true)
                }

                const hasNotifyIn30Minutes = await this.getState({...stateConfig, event: ReminderEvent.In30Minutes})
                if (diff >= 16 && diff <= 30 && !hasNotifyIn30Minutes) {
                    console.log(`[${tags.Reminder}] Sending in 30 minutes reminder event.`)
                    await this.pub.publish(ReminderEvent.In30Minutes, JSON.stringify(response))
                    await this.setState({...stateConfig, event: ReminderEvent.In30Minutes}, true)
                }

                const hasNotifyIn1Hour = await this.getState({...stateConfig, event: ReminderEvent.In1Hour})
                if (diff >= 31 && diff <= 60 && !hasNotifyIn1Hour) {
                    console.log(`[${tags.Reminder}] Sending in 1 hour reminder event.`)
                    await this.pub.publish(ReminderEvent.In1Hour, JSON.stringify(response))
                    await this.setState({...stateConfig, event: ReminderEvent.In1Hour}, true)
                }
            }
        } catch (e) {
            console.error("Error occurred while checking schedule:", e)
        }
    }
}