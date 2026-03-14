import z from "zod"

export const amikomLogoURL = "https://i.postimg.cc/8P5XGmgz/Logo-Gram.png"

export type ListHari = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT"

/**
 * Class schedule data structure returned by Amikom API
 */
export interface ClassSchedule {
    /** Index of the day of the week */
    IdHari: 0 | 1 | 2 | 3 | 4 | 5 | 6

    /** Class session */
    IdJam: 1 | 2 | 3 | 4 | 5

    /** Matkul ID */
    IdKuliah: number

    /** Additional information, mostly empty tho. */
    Keterangan: string

    /** The day of the week */
    Hari: ListHari

    /** normal classroom "x.x.x" | lab room "L x.x.x" where x is int */
    Ruang: string 

    /** Time of the class in (start-end) HH:MM-HH:MM format */
    Waktu: string

    /** Course code */
    Kode: string

    /** Course name */
    MataKuliah: string

    /** Type of the course */
    JenisKuliah: "Teori" | "Praktikum"

    /** Class section, format looks like `25S1SI04-DesainG(SI129)` */
    Kelas: string

    /** Lecturer's name */
    NamaDosen: string

    /** Lecturer's amikom.ac.id email */
    EmailDosen: string

    /** Temporary flag for attendance on amikom side, idk why they have this */
    IsBolehPresensi: 1 | 0

    /** Indicates if the class has a Zoom URL, But apperantly it's always 1. Because the `ZoomURL` is a string of "-" */
    IsZoomURL: 1 | 0

    /** The Zoom URL for the class. The value is always "-" even if its not online. If you want to implement checks, check if the value is not "-". */
    ZoomURL: string
}

export const classScheduleSchema: z.ZodType<ClassSchedule> = z.object({
    IdHari: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    IdJam: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    IdKuliah: z.number(),
    Keterangan: z.string(),
    Hari: z.enum(["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"]),
    Ruang: z.string(),
    Waktu: z.string(),
    Kode: z.string(),
    MataKuliah: z.string(),
    JenisKuliah: z.enum(["Teori", "Praktikum"]),
    Kelas: z.string(),
    NamaDosen: z.string(),
    EmailDosen: z.string(),
    IsBolehPresensi: z.union([z.literal(0), z.literal(1)]),
    IsZoomURL: z.union([z.literal(0), z.literal(1)]),
    ZoomURL: z.string(),
})