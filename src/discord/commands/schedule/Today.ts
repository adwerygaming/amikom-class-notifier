import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { Helper } from "../../../amikom/Helper.js";
import { Schedules } from "../../../amikom/Schedules.js";
import { Users } from "../../../amikom/Users.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";

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

        const submitClassInfoBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_start`)
            .setLabel("Submit Class Information")
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📚');

        if (!user) {
            const hasntSetupScheduleContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    t => t.setContent(`### No Schedule Data Found`)
                )
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(
                    t => t.setContent(`**Looks like you haven't setup your schedule data yet.**`)
                )
                .addSectionComponents(
                    s => s.addTextDisplayComponents(
                        t => t.setContent(`To use the schedule command, **you need to submit your class information & schedule data first** by using this button.`)
                    )
                        .setButtonAccessory(() => submitClassInfoBtn)
                );

            await interaction.reply({ components: [hasntSetupScheduleContainer] });
            return;
        }

        const schedule = await schedules.getByUserId(user.id);

        /**
         *   {
                id: '5d2fc903-35e4-4c5c-bce9-a27021d8e170',
                createdAt: 2026-03-31T06:06:06.742Z,
                lastModified: 2026-03-31T06:06:06.742Z,
                userId: 'e57b4aed-5dd1-42db-8db5-79198b751e56',
                isActive: true,
                IdHari: 0,
                IdJam: 2,
                IdKuliah: 83777,
                Keterangan: '',
                Hari: 'JUMAT',
                Ruang: 'L 2.2.1',
                Waktu: '08:50-10:30',
                Kode: 'SI084',
                MataKuliah: 'BAHASA PEMROGRAMAN I',
                JenisKuliah: 'Praktikum',
                Kelas: '25S1SI04-BahasaP(SI084)',
                NamaDosen: 'Hendra Kurniawan, S.Kom., M.Kom.',
                EmailDosen: 'hendrakurniawan@amikom.ac.id',
                IsBolehPresensi: 0,
                IsZoomURL: 1,
                ZoomURL: '-'
            }
         */

        const todayDayName = moment().tz("Asia/Jakarta").locale("id").format("dddd");
        const todaySchedules = schedule.filter(s => s.Hari.toUpperCase() === todayDayName.toUpperCase());

        const courcesContainers = [];
        const headerContainer = new ContainerBuilder()
            .setAccentColor(Colors.Purple)
            .addTextDisplayComponents(
                t => t.setContent(`### Today's Schedule`)
            );

        for (const c of todaySchedules) {
            const now = moment();
            const { start, end } = await helper.resolveClassTime({ time: c.Waktu });

            const duration = moment.duration(end.diff(start));
            const isInRange = now.isBetween(start, end);
            // const isPassed = start.isAfter(now);
            const isUpcoming = start.isBefore(now) && end.isAfter(now);
            const upcomingInMinutes = start.diff(now, "minutes");

            const time = `${start.format("HH:mm")} - ${end.format("HH:mm")}`;
            const timeField = `**${time}** (${helper.formatDuration(duration.as("minutes"))})`;
            
            const room = c.Ruang;
            const roomFormatted = helper.resolveRoomCode(room).string;
            
            const roomField = `**${room}** (${roomFormatted})`;

            const courseContainer = new ContainerBuilder()
                .setAccentColor(isInRange ? Colors.Orange : Colors.DarkPurple)
                .addTextDisplayComponents(
                    t => t.setContent(`### ${c.MataKuliah}\n${isUpcoming ? `Starts in **${helper.formatDuration(upcomingInMinutes)}**` : ""}`)
                )
                .addTextDisplayComponents(
                    t => t.setContent(`⏱️ ${timeField}\n🚪 ${roomField}\n👤 ${c.NamaDosen}`)
                );

            courcesContainers.push(courseContainer);
        }

        await interaction.reply({
            components: [headerContainer, ...courcesContainers],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
} as SlashCommandLayout;
