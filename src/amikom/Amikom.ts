import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ClassSchedule, classScheduleSchema } from "../types/Amikom.types.js";
import tags from "../utils/Tags.js";

const dataPath = path.join(process.cwd(), "data")
const schedulePath = path.join(dataPath, "schedule.json")

const scheduleSchema = z.array(classScheduleSchema)

// auto create the path if not exist
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath)
}

export class Amikom {
    async writeSchedule(raw_schedule: string): Promise<void> {
        try {
            let rawSchedule: unknown

            try {
                rawSchedule = JSON.parse(raw_schedule)
            } catch {
                throw new Error("Failed to parse raw schedule data.");
            }

            const schedule = scheduleSchema.safeParse(rawSchedule)

            if (!schedule.success) {
                throw new Error("The schedule appears to be in an invalid format.", { cause: schedule.error })
            }

            await fs.promises.writeFile(schedulePath, JSON.stringify(schedule.data, null, 2), "utf-8")
        } catch (e) {
            console.log(`[${tags.Error}] Failed to write schedule to ${schedulePath}`)
            console.error(e)
            throw e
        }
    }

    async readSchedule(): Promise<ClassSchedule[]> {
        if (!fs.existsSync(schedulePath)) {
            throw new Error(`Schedule file not found at ${schedulePath}. Please make sure to write the schedule first.`)
        }

        try {
            const data = await fs.promises.readFile(schedulePath, "utf-8")
            let rawSchedule: unknown

            try {
                rawSchedule = JSON.parse(data)
            } catch {
                throw new Error("Failed to parse schedule data from file.");
            }
            
            const schedule = scheduleSchema.safeParse(rawSchedule)

            if (!schedule.success) {
                throw new Error("The schedule appears to be in an invalid format.", { cause: schedule.error })
            }

            return schedule.data
        } catch (e) {
            console.log(`[${tags.Error}] Failed to read schedule from ${schedulePath}`)
            console.error(e)
            throw e
        }
    }
}