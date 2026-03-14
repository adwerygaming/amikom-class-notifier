export type ListHari = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT"

/**
 * Class schedule data structure returned by amikom API
 */
export interface ClassSchedule {
    /** Index of the day of the week */
    IdHari: 0 | 1 | 2 | 3 | 4 | 5 | 6

    /** Class session */
    IdJam: 1 | 2 | 3 | 4

    /** Matkul ID */
    IdKuliah: number

    /** Additional information, mostly empty tho. */
    Keterangan: string

    /** The day of the week */
    Hari: ListHari

    /** normal classroom "x.x.x" | lab room "L x.x.x" where x is int */
    Ruang: string 

    /** Time of the class in HH:MM format */
    Waktu: string

    /** Course code */
    Kode: string

    /** Course name */
    MataKuliah: string

    /** Type of the course */
    JenisKuliah: "Teori" | "Praktikum"

    /** Class section */
    Kelas: string

    /** Instructor name */
    NamaDosen: string
    
    /** Temporary flag for attendance on amikom side, idk why they have this */
    IsBolehPresensi: 1 | 0
}