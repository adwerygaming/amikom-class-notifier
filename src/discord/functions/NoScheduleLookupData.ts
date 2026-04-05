import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import tags from "../../utils/Tags.js";

export default async function HandleNoScheduleLookupData(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
        const noScheduleDataContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addTextDisplayComponents(text => text.setContent("### No schedule data"))
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent("There is no schedule data found matching your assigned class. Please ask your server admin to set the schedule for your class using the `/schedule set` command.")
            );

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                components: [noScheduleDataContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        } else {
            await interaction.reply({
                components: [noScheduleDataContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle No Schedule Lookup Data situation.`);
        console.error(e);
    }
}
