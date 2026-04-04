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
        .setName("today")
        .setDescription("View your schedule for today"),
    execute: async (_client: Client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        const user = await users.getByDiscordId(interaction.user.id);
        if (!user) {
            await HandleUserHasNotSetupSchedule(interaction);
            return;
        }

        const now = moment().tz("Asia/Jakarta");
        const todayDayName = now.locale("id").format("dddd");

        const schedule = await schedules.getByUserId(user.id);
        const todaySchedules = schedule
            .filter(s => s.Hari.toUpperCase() === todayDayName.toUpperCase())
            .sort((a, b) => a.IdJam - b.IdJam);
        const todayFormatted = now.format("dddd, DD MMMM YYYY");

        const coursesContainers = [];
        const headerContainer = new ContainerBuilder()
            .setAccentColor(Colors.Purple)
            .addTextDisplayComponents(
                t => t.setContent(`### Today's Schedule`)
            )
            .addTextDisplayComponents(
                t => t.setContent(`You have **${todaySchedules.length} class${todaySchedules.length !== 1 ? "es" : ""}** today.`)
            )
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(
                t => t.setContent(`🗓️ **${todayFormatted}**`)
            );

        for(let i = 0; i < todaySchedules.length; i++) {
            const course = todaySchedules[i];

            const now = moment().tz("Asia/Jakarta");
            const { start: courseStart, end: courseEnd } = await helper.resolveClassTime({ time: course.Waktu });

            // Calculations
            const duration = moment.duration(courseEnd.diff(courseStart));
            const isInRange = now.isBetween(courseStart, courseEnd);
            // const isPassed = courseStart.isAfter(now);
            const isUpcoming = now.isBefore(courseStart);
            const upcomingDiscordTimestamp = `<t:${Math.floor(courseStart.unix())}:R>`;

            // Header formatting
            const title = `${course.MataKuliah}`;
            const subtitle = `${course.JenisKuliah == "Praktikum" ? "-# Praktikum" : ""}\n${isUpcoming ? `Starts ${upcomingDiscordTimestamp}` : ""}`;

            // Time formatting
            const time = `${courseStart.format("HH:mm")} - ${courseEnd.format("HH:mm")}`;
            const timeField = `**${time}** (${helper.formatDuration(duration.as("minutes"))})`;

            // Room formatting
            const room = course.Ruang;
            const roomFormatted = helper.resolveRoomCode(room).string;
            const roomField = `**${room}** (${roomFormatted})`;

            // Lecturer formatting
            const lecturer = `${course.NamaDosen}`;
            const lecturerField = `${lecturer}`;

            // Build container
            const courseContainer = new ContainerBuilder()
                .setAccentColor(isInRange ? Colors.Orange : Colors.DarkPurple);

            if (isInRange) {
                courseContainer.addTextDisplayComponents(t => t.setContent(`**You are here!**`));
            }

            courseContainer
                .addTextDisplayComponents(t => t.setContent(`### ${title}\n${subtitle}`))
                .addTextDisplayComponents(t => t.setContent(`⏱️ ${timeField}\n🚪 ${roomField}\n👤 ${lecturerField}`));

            if (course.Keterangan) {
                courseContainer.addTextDisplayComponents(t => t.setContent(`📝 **${course.Keterangan}**`));
            }

            coursesContainers.push(courseContainer);

            const nextCourse: ScheduleSchema | undefined = todaySchedules[i + 1];
            if (!nextCourse) {
                continue;
            }

            const { start: nextCourseStart } = await helper.resolveClassTime({ time: nextCourse.Waktu });

            // Gap calculation
            const hasGap = nextCourseStart.isAfter(courseEnd);
            if (hasGap) {
                const gapDurationInMinutes = nextCourseStart.diff(courseEnd, "minutes");
                const isCurrentGap = now.isBetween(courseEnd, nextCourseStart, undefined, "[)");

                const gapText = isCurrentGap
                    ? `**You are here!** ${helper.formatDuration(gapDurationInMinutes)} until your next class.`
                    : `**${helper.formatDuration(gapDurationInMinutes)}** gap`;

                const gapContainer = new ContainerBuilder()
                    .setAccentColor(isCurrentGap ? Colors.Orange : Colors.DarkGrey)
                    .addTextDisplayComponents(t => t.setContent(gapText));

                coursesContainers.push(gapContainer);
            }
        };

        // still 0 after loop? means no courses today.
        if (coursesContainers.length === 0) {
            const noCoursesContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkPurple)
                .addTextDisplayComponents(
                    t => t.setContent(`You have **no classes** for today.`)
                );

            coursesContainers.push(noCoursesContainer);
        }
        await interaction.reply({
            components: [headerContainer, ...coursesContainers],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
} as SlashCommandLayout;
