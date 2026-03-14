import moment from "moment-timezone"

interface ResolveClassTimeResult {
    start: moment.Moment
    end: moment.Moment
}

export class Helper {
    convertStringTimeToMoment(time: string): moment.Moment {
        if (!time || !time.includes(":")) {
            throw new Error(`Invalid time format: ${time}. Expected format "HH:mm-HH:mm".`)
        }

        const [hour, minute] = time.split(":").map(Number)

        if (isNaN(hour) || isNaN(minute)) {
            throw new Error(`Invalid time values in: ${time}`)
        }

        return moment().tz("Asia/Jakarta").set({ hour, minute, second: 0, millisecond: 0 })
    }

    resolveClassTime(time: string): ResolveClassTimeResult {
        const [start, end] = time.split("-")

        return {
            start: this.convertStringTimeToMoment(start),
            end: this.convertStringTimeToMoment(end),
        }
    }

    getTodayDateKey(): string {
        return moment().tz("Asia/Jakarta").format("YYYY-MM-DD")
    }
}