import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
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

        // TODO: rework later. either get the subscription from user class info or make a menu selection. admin only btw
    }
} as SlashCommandLayout