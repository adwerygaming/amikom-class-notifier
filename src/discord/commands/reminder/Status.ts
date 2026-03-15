import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js"
import moment from "moment-timezone"
import { Subscriptions } from "../../../amikom/Subscriptions.js"
import { amikomLogoURL } from "../../../types/Amikom.types.js"
import { SlashCommandLayout } from "../../../types/Discord.types.js"

export default {
    metadata: new SlashCommandBuilder()
        .setName("status")
        .setDescription("Check your subscription status and channel for schedule reminders."),
    async execute(_client, interaction) {
        if (!interaction.guild) {
            const noGuildContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`This command can only be used in a server. Please use this command in a server to subscribe to schedule reminders.`)
                )

            return await interaction.reply({
                components: [noGuildContainer],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            })
        }

        const guildId = interaction.guild.id
        const subscriptions = new Subscriptions(guildId)
        const existingSubscription = await subscriptions.fetch()

        if (!existingSubscription) {
            const notSubscribedContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkPurple)
                .addTextDisplayComponents(
                    text => text.setContent(`**${interaction.guild?.name}** is currently **not subscribed** to schedule reminders.`)
                )

            return await interaction.reply({
                components: [notSubscribedContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }

        const authorId = existingSubscription.author_id
        const channelId = existingSubscription.channel_id
        const createdAt = existingSubscription.created_at
        const createdAtUnix = Math.floor(moment(createdAt).unix())
        // const isActive = existingSubscription.is_active

        const statusContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkPurple)
            .addSectionComponents(
                sec => sec.addTextDisplayComponents(
                    text => text.setContent(`### Class Schedule Reminder\n**${interaction.guild?.name}** has subscribed to schedule reminders.`)
                )
                    .setThumbnailAccessory(
                        img => img.setURL(interaction.guild?.iconURL() || amikomLogoURL)
                    )
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent(`Channel: <#${channelId}>.`)
            )
            .addTextDisplayComponents(
                text => text.setContent(`Subscribed by <@${authorId}>.`)
            )
            .addTextDisplayComponents(
                text => text.setContent(`Subscribed <t:${createdAtUnix}:R>.`)
            )

        await interaction.reply({
            components: [statusContainer],
            flags: [MessageFlags.IsComponentsV2],
        })
    }
} as SlashCommandLayout