import { PermissionResolvable, PermissionsBitField } from "discord.js";
import moment from "moment-timezone";

interface ResolveClassTimeResult {
    start: moment.Moment
    end: moment.Moment
}

interface ResolveClassTimeProp {
    time: string
    now?: moment.Moment
}

interface ConvertStringTimeToMomentProp {
    time: string
    now?: moment.Moment
}

export interface ResolvedRoomData {
    type: RoomType
    building: number
    floor: number
    room: number
    string: string
}

export type RoomType = "Ruang Kelas" | "Laboratorium"

export class Helper {
    /**
     * Converts a time string in the format "HH:mm" to a moment object with the same time on the current day.
     * @param options.time The time string to convert.
     * @param options.now An optional moment object representing the current time. If not provided, the current time will be used.
     * @returns A moment object representing the specified time on the current day.
     * @throws Will throw an error if the time format is invalid or if the hour/minute values are not numbers.
     * @example
     * convertStringTimeToMoment({ time: "08:30" }) // returns a moment object representing 8:30 AM on the current day
     */
    convertStringTimeToMoment({ time, now }: ConvertStringTimeToMomentProp): moment.Moment {
        now = now || moment();
        if (!time || !time.includes(":")) {
            throw new Error(`Invalid time format: ${time}. Expected format "HH:mm".`);
        }

        const [hour, minute] = time.split(":").map(Number);

        if (isNaN(hour) || isNaN(minute)) {
            throw new Error(`Invalid time values in: ${time}`);
        }

        return now.clone().set({ hour, minute, second: 0, millisecond: 0 });
    }

    /**
     * Resolves class time from a string format (e.g. "08:00-09:40") to moment objects representing the start and end times.
     * @param options.time The time string to resolve.
     * @param options.now An optional moment object representing the current time. If not provided, the current time will be used.
     * @returns {ResolveClassTimeResult} An object containing the start and end times as moment objects.
     * @example
     * resolveClassTime({ time: "08:00-09:40" }) // returns { start: moment("08:00"), end: moment("09:40") }
     */
    resolveClassTime({ time, now }: ResolveClassTimeProp): ResolveClassTimeResult {
        now = now || moment();
        const [start, end] = time.split("-");

        return {
            start: this.convertStringTimeToMoment({ time: start, now }),
            end: this.convertStringTimeToMoment({ time: end, now }),
        };
    }

    /**
     * Resolves a room code in the format "x.x.x" (e.g. "05.03.01") to an object containing the building, floor, and room as sentence.
     * @param roomCode Room code that looks like 05.03.01
     * @returns {ResolvedRoomData} An object containing the building, floor, room, and a formatted string.
     * @throws Will throw an error if the room code format is invalid.
     * @example
     * resolveRoomCode("05.03.01") // returns { type: "Ruang Kelas", building: 5, floor: 3, room: 1, string: "Gedung 5, Lantai 3, Ruang ke 1" }
     */
    resolveRoomCode(roomCode: string): ResolvedRoomData {
        const roomType: RoomType = roomCode.includes("L") ? "Laboratorium" : "Ruang Kelas";
        const rooms = roomCode.split(".");

        let building = rooms?.[0];
        const floor = rooms?.[1];
        const room = rooms?.[2];

        if (!building || !floor || !room) {
            throw new Error(`Invalid room code format: ${roomCode}. Expected format "x.x.x" where x is an integer.`);
        }

        // remove L in building part
        if (building.includes("L")) {
            building = building.replace("L", "").trimStart();
        }

        // padding
        const buildingNum = parseInt(building, 10);
        const floorNum = parseInt(floor, 10);
        const roomNum = parseInt(room, 10);

        if (isNaN(buildingNum) || isNaN(floorNum) || isNaN(roomNum)) {
            throw new Error(`Invalid room code values in: ${roomCode}`);
        }

        const data: ResolvedRoomData = {
            type: roomType,
            building: buildingNum,
            floor: floorNum,
            room: roomNum,
            string: `Gedung ${buildingNum}, Lantai ${floorNum}, Ruang ke ${roomNum}`
        };

        return data;
    }

    /**
     * Converts minutes in number into a dynamic string format like "1h 30m", "45m", "2h", etc.
     * @param minutes in number to convert into a dynamic string format.
     * @returns a string representing the duration in a human-readable format.
     * @example
     * formatDuration(90) // returns "1h 30m"
     * formatDuration(45) // returns "45m"
     * formatDuration(120) // returns "2h"
     */
    formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const parts = [] as string[];

        if (hours) parts.push(`${hours}h`);
        if (mins) parts.push(`${mins}m`);

        return parts.length ? parts.join(" ") : "0m";
    }

    /**
     * Captialize the first letter of each word in a string and make the rest of the letters lowercase.
     * @param text string of sentence to capitalize
     * @returns a string with the first letter of each word capitalized and the rest of the letters in lowercase.
     * @example
     * capitalizeWords("hello world") // returns "Hello World"
     * capitalizeWords("tYpEsCrIpT") // returns "Typescript"
     * capitalizeWords("AMIkOM") // returns "Amikom"
     */
    capitalizeWords(text: string): string {
        return text.replace(/\b([A-Za-z])([A-Za-z]*)/g, (_match, first, rest) => {
            return `${first.toUpperCase()}${rest.toLowerCase()}`;
        });
    }

    toReadableNames(permissions: PermissionResolvable[]): string[] {
        const names = new PermissionsBitField(permissions).toArray();
        return names.map(name => name
            .replace(/_/g, " ")
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .split(" ")
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
        );
    }
}
