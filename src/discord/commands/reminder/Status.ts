import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { amikomLogoURL } from "../../../types/Amikom.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";

export default {
    metadata: new SlashCommandBuilder()
        .setName("status")
        .setDescription("Check your subscription status and channel for schedule reminders."),
    async execute(_client, interaction) {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        const guildId = interaction.guild.id;
        const subscriptions = new Subscriptions(guildId);
        const existingSubscriptions = await subscriptions.fetch(true);

        if (!existingSubscriptions || existingSubscriptions.length === 0) {
            const notSubscribedContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkPurple)
                .addTextDisplayComponents(
                    text => text.setContent(`**${interaction.guild?.name}** is currently **not subscribed** to any class schedule reminders.`)
                );

            return await interaction.reply({
                components: [notSubscribedContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
        }

        // const isActive = existingSubscriptions.is_active

        const statusContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkPurple)
            .addSectionComponents(
                sec => sec.addTextDisplayComponents(
                    text => text.setContent(`### Class Schedule Reminder\n**${interaction.guild?.name}** has subscribed to ${existingSubscriptions.length} schedule reminders.`)
                )
                    .setThumbnailAccessory(
                        img => img.setURL(interaction.guild?.iconURL() || amikomLogoURL)
                    )
            );

        for (const sub of existingSubscriptions) {
            const createdAtUnix = Math.floor(moment(sub.created_at).unix());

            const sch = sub.schedule_data;
            const scheduleLabel = sch
                ? `${sch.entry_year} ${sch.major} ${sch.class_number}`
                : "(schedule data unavailable)";

            statusContainer.addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`### ${scheduleLabel}`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`Channel <#${sub.channel_id}>.`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`Subscribed by <@${sub.user_id}>.`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`Subscribed <t:${createdAtUnix}:R>.`)
                );
        }

        await interaction.reply({
            components: [statusContainer],
            flags: [MessageFlags.IsComponentsV2],
        });
    }
} as SlashCommandLayout;