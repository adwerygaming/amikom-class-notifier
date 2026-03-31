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
    building: string
    floor: string
    room: string
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
     */
    convertStringTimeToMoment({ time, now }: ConvertStringTimeToMomentProp): moment.Moment {
        now = now || moment();
        if (!time || !time.includes(":")) {
            throw new Error(`Invalid time format: ${time}. Expected format "HH:mm-HH:mm".`);
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
     */
    resolveRoomCode(roomCode: string): ResolvedRoomData {
        const roomType: RoomType = roomCode.includes("L") ? "Laboratorium" : "Ruang Kelas";
        const rooms = roomCode.split(".");

        let building = rooms[0];
        let floor = rooms[1];
        let room = rooms[2];

        if (!building || !floor || !room) {
            throw new Error(`Invalid room code format: ${roomCode}. Expected format "x.x.x" where x is an integer.`);
        }

        // remove L in building part
        if (building.includes("L")) {
            building = building.replace("L", "").trimStart();
        }

        // padding
        building = parseInt(building).toString();
        floor = parseInt(floor).toString();
        room = parseInt(room).toString();

        const data: ResolvedRoomData = {
            type: roomType,
            building,
            floor,
            room,
            string: `Gedung ${building}, Lantai ${floor}, Ruang ke ${room}`
        };

        return data;
    }

    getTodayDateKey(): string {
        return moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
    }

    formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const parts = [] as string[];

        if (hours) parts.push(`${hours}h`);
        if (mins) parts.push(`${mins}m`);

        return parts.length ? parts.join(" ") : "0m";
    }

    capitalizeWords(text: string): string {
        return text.replace(/\b([A-Za-z])([A-Za-z]*)/g, (_match, first, rest) => {
            return `${first.toUpperCase()}${rest.toLowerCase()}`;
        });
    }
}
