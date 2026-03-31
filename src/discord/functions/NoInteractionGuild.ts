import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import tags from "../../utils/Tags.js";

export default async function HandleNoInteractionGuild(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
        const noGuildContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent(`This command can only be used in a server.`)
            );

        await interaction.reply({
            components: [noGuildContainer],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
        });
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle No Interaction Guild situation.`);
        console.error(e);
    }
}