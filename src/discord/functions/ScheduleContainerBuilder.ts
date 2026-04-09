import { ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, User } from "discord.js";
import moment from "moment-timezone";
import { Helper } from "../../amikom/Helper.js";
import { Schedules } from "../../amikom/Schedules.js";
import { BaseContext, ContextManager } from "../../database/ContextManager.js";
import { CourseType } from "../../types/Amikom.types.js";
import { ScheduleSchema } from "../../types/Database.types.js";
import tags from "../../utils/Tags.js";

const schedules = new Schedules();
const helper = new Helper();

interface ScheduleContainerBaseProp {
    now: moment.Moment;
}

interface BuildGapContainerProp extends ScheduleContainerBaseProp {
    currentCourse: ScheduleSchema;
    nextCourse: ScheduleSchema;
}

interface BuildCourseContainerProp extends ScheduleContainerBaseProp {
    course: ScheduleSchema;
}

interface BuildProp {
    withActionButtons?: boolean;
}

export interface ButtonMovementContextData extends BaseContext {
    userId: string;
    dayIndex: number;
    now: string;
}

export class ScheduleContainerBuilder {
    constructor(
        /** The user who interacted with the schedule */
        private interactionUser: User,

        /** User ID (Not Discord User ID) */
        private userId: string,

        /** Index of the day (0 = Sunday, 1 = Monday, etc.) */
        private dayIndex: number,

        /** Optional moment */
        private now: moment.Moment
    ) { }

    /**
     * Builds you: Header, courses, and gaps. All in one go.
     * @returns Ready to send `ContainerBuilder` array for the schedule.
     */
    async build({ withActionButtons = false }: BuildProp): Promise<ContainerBuilder[]> {
        const now = this.now;
        const schedules = await this.getDaySchedule({ now });
        const results = [];

        // Header
        const header = await this.buildHeaderContainer(schedules, { withActionButtons });
        results.push(header);

        // Courses and gaps
        for (let i = 0; i < schedules.length; i++) {
            const nextCursor = (i + 1) >= schedules.length ? 0 : (i + 1);
            const course = schedules[i];
            const nextCourse = schedules[nextCursor];

            const courseContainer = this.buildCourseContainer({ course, now });
            const gapContainer = this.buildGapContainer({ currentCourse: course, nextCourse, now });
            results.push(courseContainer);

            if (gapContainer) {
                results.push(gapContainer);
            }
        }

        if (schedules.length === 0) {
            const noClassesContainer = this.buildNoClassesContainer({ now: this.now });
            results.push(noClassesContainer);
        }
        
        return results;
    }

    /**
     * Returns the schedule for user on a specific day index.
     * @param options.userId - Discord User ID to fetch the schedule for.
     * @param options.dayIndex - Index of the day (0 = Sunday, 1 = Monday, etc.) to get the schedule for.
     * @returns ScheduleSchema[] - Array of courses scheduled for the specified day. Might be empty if no courses are scheduled.
     */
    private async getDaySchedule({ now }: ScheduleContainerBaseProp): Promise<ScheduleSchema[]> {
        const todayName = now.day(this.dayIndex).locale("id").format("dddd");

        const schedule = await schedules.getByUserId(this.userId);
        const todaySchedules = schedule
            .filter(s => s.Hari.toUpperCase() === todayName.toUpperCase())
            .sort((a, b) => a.IdJam - b.IdJam);

        return todaySchedules;
    }

    private isToday(): boolean {
        const todayIdx = moment().day();
        return todayIdx === this.dayIndex;
    }

    private buildNoClassesContainer({ now }: ScheduleContainerBaseProp): ContainerBuilder {
        const isToday = this.isToday();
        const dayText = isToday ? "today" : now.day(this.dayIndex).locale("id").format("dddd");

        const noClassesContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkGrey)
            .addTextDisplayComponents(t => t.setContent(`### You have no classes for ${dayText}.`));

        return noClassesContainer;
    }

    private async buildActionButtonsComponents({ now }: ScheduleContainerBaseProp): Promise<ButtonBuilder[]> {
        const daysButtons: ButtonBuilder[] = [];
        const daysOfWeek = [1, 2, 3, 4, 5];

        for (const dayIdx of daysOfWeek) {
            const isToday = dayIdx === this.dayIndex;
            const day = now.day(dayIdx).format("dddd");

            const ctxId = await ContextManager.create<ButtonMovementContextData>({
                executorUserId: this.interactionUser.id,
                userId: this.userId,
                dayIndex: dayIdx,
                now: now.toISOString()
            });

            const btn = new ButtonBuilder()
                .setCustomId(`schedule_${this.interactionUser.id}_show_${ctxId}`)
                .setLabel(day)
                .setStyle(isToday ? ButtonStyle.Secondary : ButtonStyle.Primary)
                .setDisabled(isToday);

            daysButtons.push(btn);
        }

        return daysButtons;
    }

    private async buildHeaderContainer(schedules: ScheduleSchema[], { withActionButtons }: BuildProp): Promise<ContainerBuilder> {
        const todayDate = this.now.locale("en").format("dddd, DD MMMM YYYY");
        const isToday = this.isToday();
        const isHasMoreThanOneCourse = schedules.length != 1; // because why not?

        const dayText = isToday ? "today" : `on ${this.now.day(this.dayIndex).locale("en").format("dddd")}`;
        const headerContainer = new ContainerBuilder()
            .setAccentColor(Colors.Blurple)
            .addTextDisplayComponents(t => t.setContent(`### Course${isHasMoreThanOneCourse ? "s" : ""} Schedule`)) // lol
            .addTextDisplayComponents(t => t.setContent(`You have **${schedules.length} class${schedules.length !== 1 ? "es" : ""}** ${dayText}.`))
            .addTextDisplayComponents(t => t.setContent(`📅 **${todayDate}**`));

        // Day navigation buttons
        if (withActionButtons) {
            const now = this.now;
            const buttonComponents = await this.buildActionButtonsComponents({ now });
            
            headerContainer.addSeparatorComponents(s => s)
                .addActionRowComponents(r => r.addComponents(...buttonComponents));
        }

        headerContainer.addSeparatorComponents(s => s);

        return headerContainer;
    }

    private buildGapContainer({ currentCourse, nextCourse, now }: BuildGapContainerProp): ContainerBuilder | null {
        const { end: currentCourseEnd } = helper.resolveClassTime({ time: currentCourse.Waktu, now });
        const { start: nextCourseStart } = helper.resolveClassTime({ time: nextCourse.Waktu, now });

        // Gap calculation
        const hasGap = nextCourseStart.isAfter(currentCourseEnd);
        if (hasGap) {
            const gapDurationInMinutes = nextCourseStart.diff(currentCourseEnd, "minutes");
            const gapDurationRelativeToNowInMinutes = nextCourseStart.diff(now, "minutes");
            const isCurrentGap = now.isBetween(currentCourseEnd, nextCourseStart, undefined, "[)");

            const gapText = isCurrentGap
                ? `**You are here!** **${helper.formatDuration(gapDurationRelativeToNowInMinutes)}** until your next class.`
                : `**${helper.formatDuration(gapDurationInMinutes)}** gap`;

            const gapContainer = new ContainerBuilder()
                .setAccentColor(isCurrentGap ? Colors.White : Colors.DarkGrey)
                .addTextDisplayComponents(t => t.setContent(gapText));

            return gapContainer;
        } else {
            return null;
        }
    }

    private buildCourseContainer({ course, now }: BuildCourseContainerProp): ContainerBuilder {
        const courseType = course.JenisKuliah;

        const { start: courseStart, end: courseEnd } = helper.resolveClassTime({ time: course.Waktu, now: moment() });
        const isToday = courseStart.isSame(now, "day");

        console.log(`[${tags.Debug}] isToday: ${isToday} | courseStart: ${courseStart.format("dddd")} | now: ${now.format("dddd")}`);

        // Calculations
        const duration = moment.duration(courseEnd.diff(courseStart));
        const isInRange = now.isBetween(courseStart, courseEnd) && isToday;
        const isUpcoming = now.isBefore(courseStart) && isToday;
        const upcomingDiscordTimestamp = `<t:${Math.floor(courseStart.unix())}:R>`;

        // Header formatting
        const title = course.MataKuliah;
        const subtitle = `${courseType == CourseType.Praktikum ? "-# Praktikum" : ""}\n${isUpcoming ? `Starts ${upcomingDiscordTimestamp}` : ""}`;

        // Time formatting
        const time = `${courseStart.format("HH:mm")} - ${courseEnd.format("HH:mm")}`;
        const timeField = `**${time}** (${helper.formatDuration(duration.as("minutes"))})`;

        // Room formatting
        const room = course.Ruang;
        const { string: roomString } = helper.resolveRoomCode(room);
        const roomField = `**${room}** (${roomString})`;

        // Lecturer formatting
        const lecturer = course.NamaDosen;
        const lecturerField = lecturer;

        // Build container
        const courseContainer = new ContainerBuilder()
            .setAccentColor(isInRange ? Colors.White : courseType == CourseType.Praktikum ? Colors.Orange : Colors.Purple);

        if (isInRange) {
            courseContainer.addTextDisplayComponents(t => t.setContent(`**You are here!**`));
        }

        courseContainer
            .addTextDisplayComponents(t => t.setContent(`### ${title}\n${subtitle}`))
            .addTextDisplayComponents(t => t.setContent(`⏱️ ${timeField}\n🚪 ${roomField}\n👤 ${lecturerField}`));

        if (course.Keterangan) {
            courseContainer.addTextDisplayComponents(t => t.setContent(`📝 **${course.Keterangan}**`));
        }

        return courseContainer;
    }
}
