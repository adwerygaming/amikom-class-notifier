import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { ScheduleData } from "../../../amikom/ScheduleData.js";
import { UserClassAssignments } from "../../../amikom/UserClassAssignments.js";
import { amikomLogoURL } from "../../../types/Amikom.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleAssigningUserClassInfo from "../../functions/AssigningUserClassInfo.js";
import { buildScheduleContainers } from "../../functions/ClassSchedules.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleNoScheduleLookupData from "../../functions/NoScheduleLookupData.js";

const scheduleData = new ScheduleData();

export default {
    metadata: new SlashCommandBuilder()
        .setName("weekly")
        .setDescription("Get current schedule data in a week timeframe."),
    async execute(_client, interaction) {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        const userClassAssignments = new UserClassAssignments({
            guildId: interaction.guild.id,
            userId: interaction.user.id
        });

        try {
            const userClass = await userClassAssignments.fetch();

            if (!userClass) {
                await HandleAssigningUserClassInfo(interaction);
                return;
            }

            await interaction.deferReply();

            const userScheduleId = userClass.schedule_id;
            const scheduleLookup = await scheduleData.getById({ id: userScheduleId });

            if (!scheduleLookup) {
                await HandleNoScheduleLookupData(interaction);
                return;
            }

            const schedule = scheduleLookup.schedule;

            const now = moment().tz("Asia/Jakarta").locale("id");
            const dateFormatted = now.format("dddd, DD MMMM YYYY");

            const summary = new ContainerBuilder()
                .setAccentColor(Colors.Purple)
                .addSectionComponents(
                    sec => sec.addTextDisplayComponents(
                        text => text.setContent(`### Class Schedule for this week\nToday is: **${dateFormatted}**`)
                    )
                        .setThumbnailAccessory(img => img.setURL(amikomLogoURL))
                );

            const { containers: dayContainers } = buildScheduleContainers({
                schedule,
                now,
            });

            const components = dayContainers.length
                ? [summary, ...dayContainers]
                : [summary.addTextDisplayComponents(text => text.setContent("_No classes found in the schedule. Please set it with /schedule set._"))];

            await interaction.editReply({
                components,
                flags: [MessageFlags.IsComponentsV2],
            });
        } catch (e) {
            console.error(e);
            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Something went wrong")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Failed to read schedule data. Please make sure you have set the schedule using `/schedule set` command.")
                );

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
            return;
        }
    }
} as SlashCommandLayout;