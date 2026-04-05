import { ChatInputCommandInteraction, Client, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { Helper } from "../../../amikom/Helper.js";
import { Schedules } from "../../../amikom/Schedules.js";
import { Users } from "../../../amikom/Users.js";
import { ScheduleSchema } from "../../../types/Database.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleUserHasNotSetupSchedule from "../../functions/UserHasNotSetupSchedule.js";

const users = new Users();
const schedules = new Schedules();
const helper = new Helper();

export default {
    metadata: new SlashCommandBuilder()
        .setName("weekly")
        .setDescription("Show your class schedule for the current week."),
    execute: async (_client: Client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        await interaction.deferReply();

        const user = await users.getByDiscordId(interaction.user.id);
        if (!user) {
            await HandleUserHasNotSetupSchedule(interaction);
            return;
        }

        const now = moment().tz("Asia/Jakarta");
        const todayFormatted = now.format("dddd, DD MMMM YYYY");
        const todayDayName = now.locale("id").format("dddd");
        
        const schedule = await schedules.getByUserId(user.id);

        // remapping to per day schedule
        const weeklySchedules = schedule.reduce<Record<string, typeof schedule>>((acc, course) => {
            const courseDay = helper.capitalizeWords(course.Hari);
            if (typeof acc[courseDay] === "undefined") acc[courseDay] = [];
            acc[courseDay].push(course);
            return acc;
        }, {});
        for (const courses of Object.values(weeklySchedules)) {
            courses.sort((a, b) => a.IdJam - b.IdJam);
        }
        const totalCourses = schedule.length;

        //! 1 container = 1 day
        const coursesContainers = [];
        const headerContainer = new ContainerBuilder()
            .setAccentColor(Colors.Purple)
            .addTextDisplayComponents(t => t.setContent(`### Weekly Schedule`))
            .addTextDisplayComponents(t => t.setContent(`You have **${totalCourses} class${totalCourses !== 1 ? "es" : ""}** this week.`))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(t => t.setContent(`🗓️ **${todayFormatted}**`));

        for (const [day, courses] of Object.entries(weeklySchedules)) {
            // per day
            const formattedDayName = helper.capitalizeWords(day);
            const isToday = day.toLowerCase() === todayDayName.toLowerCase();

            const todayContainer = new ContainerBuilder()
                .setAccentColor(isToday ? Colors.Orange : Colors.DarkPurple)
                .addTextDisplayComponents(t => t.setContent(`### ${formattedDayName}`))
                .addSeparatorComponents(s => s);

            for (let i = 0; i < courses.length; i++) {
                const course = courses[i];
                const { start: courseStart, end: courseEnd } = helper.resolveClassTime({ time: course.Waktu, now });
                const duration = moment.duration(courseEnd.diff(courseStart));

                // Time formatting
                const time = `${courseStart.format("HH:mm")} - ${courseEnd.format("HH:mm")}`;
                const timeField = `**${time}** (${helper.formatDuration(duration.as("minutes"))})`;

                // Room formatting
                const room = course.Ruang;
                const roomFormatted = helper.resolveRoomCode(room).string;
                const roomField = `**${room}** (${roomFormatted})`;

                // Lecturer formatting
                const lecturer = course.NamaDosen;
                const lecturerField = lecturer;

                todayContainer.addTextDisplayComponents(t => t.setContent(`**${course.MataKuliah}**\n⏱️ ${timeField}\n🚪 ${roomField}\n👤 ${lecturerField}`));

                const nextCourse: ScheduleSchema | undefined = courses[i + 1];
                if (typeof nextCourse === "undefined") {
                    continue;
                }

                const { start: nextCourseStart } = helper.resolveClassTime({ time: nextCourse.Waktu, now });

                // Gap calculation
                const hasGap = nextCourseStart.isAfter(courseEnd);
                if (hasGap && isToday) {
                    const gapDurationInMinutes = nextCourseStart.diff(courseEnd, "minutes");
                    const isCurrentGap = now.isBetween(courseEnd, nextCourseStart, undefined, "[)");

                    const gapText = isCurrentGap
                        ? `👉 **You are here!**. **${helper.formatDuration(gapDurationInMinutes)}** until your next class.`
                        : `**${helper.formatDuration(gapDurationInMinutes)}** gap`;

                    todayContainer.addTextDisplayComponents(t => t.setContent(`> ${gapText}`));
                }
            }

            coursesContainers.push(todayContainer);
        }

        await interaction.editReply({
            components: [headerContainer, ...coursesContainers],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
} as SlashCommandLayout;
