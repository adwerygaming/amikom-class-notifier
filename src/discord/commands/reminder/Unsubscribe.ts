import { ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";


export default {
    metadata: new SlashCommandBuilder()
        .setName("unsubscribe")
        .setDescription("Unsubscribe from schedule reminders."),
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
                .setAccentColor(Colors.Yellow)
                .addTextDisplayComponents(
                    text => text.setContent(`**${interaction.guild?.name}** is not subscribed to schedule reminders.`)
                )

            return await interaction.reply({
                components: [notSubscribedContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }

        const yesBtn = new ButtonBuilder()
            .setLabel("Yes, Unsubscribe")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`unsubscribe_${interaction.user.id}_confirm`)

        const noBtn = new ButtonBuilder()
            .setLabel("No, Keep us subscribed")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`unsubscribe_${interaction.user.id}_cancel`)

        const confirmContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkPurple)
            .addTextDisplayComponents(
                text => text.setContent(`### Unsubscribe from Schedule Reminders?`)
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent(`Are you sure you want to unsubscribe **${interaction.guild?.name}** from schedule reminders?`)
            )
            .addActionRowComponents(
                row => row.addComponents(yesBtn, noBtn)
            )

        await interaction.reply({
            components: [confirmContainer],
            flags: [MessageFlags.IsComponentsV2],
        })
    }
} as SlashCommandLayout