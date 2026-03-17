import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { ScheduleData } from "../../../amikom/ScheduleData.js";
import { UserClassAssignments } from "../../../amikom/UserClassAssignments.js";
import { amikomLogoURL } from "../../../types/Amikom.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleAssigningUserClassInfo from "../../functions/AssigningUserClassInfo.js";
import { buildTodayContainers } from "../../functions/ClassSchedules.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleNoScheduleLookupData from "../../functions/NoScheduleLookupData.js";

const scheduleData = new ScheduleData();

export default {
    metadata: new SlashCommandBuilder()
        .setName("today")
        .setDescription("Get today's schedule."),
    async execute(_client, interaction) {
        if (!interaction.guild) return await HandleNoInteractionGuild(interaction);

        const userClassAssignments = new UserClassAssignments({
            guildId: interaction.guild.id,
            userId: interaction.user.id
        });

        try {
            const userClass = await userClassAssignments.fetch();

            if (!userClass) return await HandleAssigningUserClassInfo(interaction);

            const userScheduleId = userClass.schedule_id;
            const scheduleLookup = await scheduleData.getById({ id: userScheduleId });

            if (!scheduleLookup) return await HandleNoScheduleLookupData(interaction);

            const schedule = scheduleLookup.schedule;

            await interaction.deferReply();

            const now = moment().tz("Asia/Jakarta").locale("id");
            const dateSummaryFormatted = now.format("dddd, DD MMMM YYYY");
            const summary = new ContainerBuilder()
                .setAccentColor(Colors.Purple)
                .addSectionComponents(
                    sec => sec.addTextDisplayComponents(
                        text => text.setContent(`### Today's Classes\nToday is: **${dateSummaryFormatted}**`)
                    )
                        .setThumbnailAccessory(img => img.setURL(amikomLogoURL))
                );

            const { containers } = buildTodayContainers({
                schedule,
                now,
            });

            await interaction.editReply({
                components: [summary, ...containers],
                flags: [MessageFlags.IsComponentsV2],
            });
        } catch (e) {
            console.error(e);
            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(text => text.setContent("### Something went wrong"))
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Failed to read schedule data. Please make sure you have set the schedule using `/schedule set` command.")
                );

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
        }
    }
} as SlashCommandLayout;
