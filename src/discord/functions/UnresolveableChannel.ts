import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import tags from "../../utils/Tags.js";

export default async function HandleUnresolvableChannel(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
        const noChannelContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addTextDisplayComponents(
                text => text.setContent("### Not Found")
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent(`**Couldn't resolve target channel.** Make sure the channel is valid and I have access to it.`)
            );

        await interaction.reply({
            components: [noChannelContainer],
            flags: [MessageFlags.IsComponentsV2],
        });
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle Unresolvable Channel situation.`);
        console.error(e);
    }
}