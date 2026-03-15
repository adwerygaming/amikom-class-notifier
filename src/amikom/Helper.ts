import moment from "moment-timezone"

interface ResolveClassTimeResult {
    start: moment.Moment
    end: moment.Moment
}

export class Helper {
    convertStringTimeToMoment(now: moment.Moment, time: string): moment.Moment {
        if (!time || !time.includes(":")) {
            throw new Error(`Invalid time format: ${time}. Expected format "HH:mm-HH:mm".`)
        }

        const [hour, minute] = time.split(":").map(Number)

        if (isNaN(hour) || isNaN(minute)) {
            throw new Error(`Invalid time values in: ${time}`)
        }

        return now.clone().set({ hour, minute, second: 0, millisecond: 0 })
    }

    resolveClassTime(now: moment.Moment, time: string): ResolveClassTimeResult {
        const [start, end] = time.split("-")

        return {
            start: this.convertStringTimeToMoment(now, start),
            end: this.convertStringTimeToMoment(now, end),
        }
    }

    getTodayDateKey(): string {
        return moment().tz("Asia/Jakarta").format("YYYY-MM-DD")
    }

    formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        const parts = [] as string[]

        if (hours) parts.push(`${hours}h`)
        if (mins) parts.push(`${mins}m`)

        return parts.length ? parts.join(" ") : "0m"
    }
}