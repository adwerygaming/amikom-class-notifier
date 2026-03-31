import { ButtonInteraction, ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags, ModalSubmitInteraction } from "discord.js";
import tags from "../../utils/Tags.js";

export default async function HandleNoContext(interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction): Promise<void> {
    try {
        const noContxtContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addTextDisplayComponents(
                t => t.setContent("## No Context")
            )
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(
                t => t.setContent(`**Context Loss**: Please report this incident to developer. This is not meant to happen. **Please try again later.**`)
            );

        await interaction.reply({
            components: [noContxtContainer],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
        });
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle No Context situation.`);
        console.error(e);
    }
}