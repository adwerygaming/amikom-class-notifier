import { ChannelType, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";

export default {
    metadata: new SlashCommandBuilder()
        .setName("subscribe")
        .setDescription("Subscribe to schedule reminders.")
        .addChannelOption(
            ch => ch.setName("channel")
                .setDescription("The channel to send reminders to. If not specified, reminders will be sent to the current channel.")
                .setRequired(false)
        ),
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

        if (existingSubscription) {
            const alreadySubscribedContainer = new ContainerBuilder()
                .setAccentColor(Colors.Yellow)
                .addTextDisplayComponents(
                    text => text.setContent(`**${interaction.guild?.name}** is already subscribed to schedule reminders.`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`Reminders will be sent to <#${existingSubscription.channel_id}>.`)
                )
                .addTextDisplayComponents(
                    text => text.setContent("-# To unsubscribe, use the /reminder unsubscribe command.")
                )

            return await interaction.reply({
                components: [alreadySubscribedContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }

        const channelOpt = interaction.options.getChannel("channel") || interaction.channel
        const allowedChannelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement]

        if (!channelOpt) {
            const channelMissingContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("Channel couldn't be found.")
                )

            return await interaction.reply({
                components: [channelMissingContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }

        if (!allowedChannelTypes.includes(channelOpt?.type)) {
            const invalidChannelContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("Please select a text based channel and it must not be a voice channel.")
                )

            return await interaction.reply({
                components: [invalidChannelContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }

        const channels = await interaction.guild.channels.fetch()
        const channel = channels.get(channelOpt.id)

        if (!channel) {
            const channelInaccessibleContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("Channel couldn't be found. Make sure I have permission to access it.")
                )

            return await interaction.reply({
                components: [channelInaccessibleContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }

        await interaction.deferReply()

        const channelId = channel.id
        const userId = interaction.user.id

        try {
            await subscriptions.register({
                channelId,
                userId,
            })

            const successContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkGreen)
                .addTextDisplayComponents(
                    text => text.setContent(`### Subscription Successful`)
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`**${interaction?.guild?.name}** has been subscribed to schedule reminders.\nReminders will be sent to <#${channelId}>.`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`-# Unsubscribe from reminders by using /reminder unsubscribe command.`)
                )

            await interaction.editReply({
                components: [successContainer],
                flags: [MessageFlags.IsComponentsV2],
            })

            if (channel.isTextBased()) {
                try {
                    await channel.send({
                        content: `I will start sending class reminders to this channel. Configured by <@${userId}>.`
                    })
                } catch (e) {
                    console.error(e)
                }
            }

        } catch (e) {
            console.error(e)
            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent(`### Something went wrong.`)
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`Failed to subscribe to schedule reminders. Please try again later.`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`Error: ${e}`)
                )

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }
    }
} as SlashCommandLayout