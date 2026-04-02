import z from "zod";

export const amikomLogoURL = "https://i.postimg.cc/8P5XGmgz/Logo-Gram.png";
export type ListHari = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT"

/**
 * Class schedule data structure returned by Amikom API
 */
export interface ClassSchedule {
    /** 
     * Index of the day of the week. Apparently this **will always return 0** no matter what
     * @example 0
     */
    IdHari: 0 | 1 | 2 | 3 | 4 | 5 | 6

    /**
     * Class sessions
     * 
     * | # | Start |  End  |
     * |---|-------|-------|
     * | 1 | 07:00 | 08:40 |
     * | 2 | 08:50 | 10:30 |
     * | 3 | 10:40 | 12:20 |
     * | 4 | 13:20 | 15:00 |
     * | 5 | 15:30 | 17:10 |
    */
    IdJam: 1 | 2 | 3 | 4 | 5

    /**
     * Matkul ID
     * @example "83776"
     */
    IdKuliah: number

    /** 
     * Additional information, mostly empty tho. 
     * @example "Dilaksanakan setelah UTS"
    */
    Keterangan: string

    /** 
     * The day of the week in Indonesian and in uppercase.
     * @example "SENIN"
     */
    Hari: ListHari

    /** 
     * Classroom code. Where first digit is the building, second digit is the floor, and third digit is the room number. If the room is a lab, there will be an "L" before the code.
     * @example "7.1.1" for normal classroom
     * @example "L 7.4.1" for lab room
     */
    Ruang: string 

    /** 
     * Time of the class in (start-end) HH:MM-HH:MM format
     * @example "07:00-08:40"
     */
    Waktu: string

    /** 
     * Course code
     * @example "SI084"
    */
    Kode: string

    /** 
     * Course name
     * @example "BAHASA PEMROGRAMAN I"
     */
    MataKuliah: string

    /** 
     * Type of the course
     * @example "Teori" or "Praktikum"
     */
    JenisKuliah: "Teori" | "Praktikum"

    /** 
     * Class section. Consists of combination of Kode, Shortened MataKuliah and Kode but with 2 digits of entry year (or angkatan).
     * 
     * Structured like: **KodeWithEntryYear**-**ShortenedMataKuliah**(**Kode**)
     * @example "25S1SI04-BahasaP(SI084)"
     */
    Kelas: string

    /** 
     * Lecturer name 
     * @example "Hendra Kurniawan, S.Kom., M.Kom."
     */
    NamaDosen: string

    /** 
     * Lecturer `amikom.ac.id` email
     * @example "lecturer@amikom.ac.id"
     */
    EmailDosen: string

    /** 
     * Temporary flag for attendance on amikom side, idk why they use int insetad of boolean.
     * @example 1 when it is time to presensi, 0 when it is not.
     */
    IsBolehPresensi: 1 | 0

    /** 
     * Indicates if the class has a Zoom URL, But apperantly it's always 1. Because the `ZoomURL` is a string of "-" 
     * @example 1
     */
    IsZoomURL: 1 | 0

    /** 
     * The Zoom URL for the class. The value is always "-" even if its not online. If you want to implement checks, check if the value is not "-". 
     * @example "-" or "https://zoom.us/j/1234567890?pwd=abcdefg"
     */
    ZoomURL: string
}

export const classSchedulesSchema: z.ZodType<ClassSchedule[]> = z.array(
    z.object({
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
);
