import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";

export default async function HandleUnresolvableChannel(interaction: ChatInputCommandInteraction): Promise<void> {
    const noChannelContainer = new ContainerBuilder()
        .setAccentColor(Colors.DarkRed)
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`**Couldn't resolve target channel.** Make sure the channel is valid and I have access to it.`)
        );

    await interaction.reply({
        components: [noChannelContainer],
        flags: [MessageFlags.IsComponentsV2],
    });
}