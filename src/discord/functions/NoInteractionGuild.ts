import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js"

export default async function HandleNoInteractionGuild(interaction: ChatInputCommandInteraction): Promise<void> {
    const noGuildContainer = new ContainerBuilder()
        .setAccentColor(Colors.DarkRed)
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`This command can only be used in a server.`)
        )

    await interaction.reply({
        components: [noGuildContainer],
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    })
}