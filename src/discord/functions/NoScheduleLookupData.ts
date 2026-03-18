import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";

export default async function HandleNoScheduleLookupData(interaction: ChatInputCommandInteraction): Promise<void> {
    const noScheduleDataContainer = new ContainerBuilder()
        .setAccentColor(Colors.DarkRed)
        .addTextDisplayComponents(text => text.setContent("### No schedule data"))
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent("There is no schedule data found matching your assigned class. Please ask your server admin to set the schedule for your class using the `/schedule set` command.")
        );

    await interaction.editReply({
        components: [noScheduleDataContainer],
        flags: [MessageFlags.IsComponentsV2],
    });
}