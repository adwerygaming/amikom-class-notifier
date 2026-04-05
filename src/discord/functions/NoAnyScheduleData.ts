import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import tags from "../../utils/Tags.js";

export default async function HandleNoAnyScheduleData(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
        const noSchedulesContainer = new ContainerBuilder()
            .setAccentColor(Colors.Orange)
            .addTextDisplayComponents(
                text => text.setContent(`### No Schedules Data`)
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent(`Hey <@${interaction.user.id}>, **currently I don't have any schedule data.** This project is relying on volunteers to provide schedule data for anyone.`)
            )
            .addTextDisplayComponents(
                text => text.setContent(`If you want to participate by submitting your class data and helps anybody else, please contact an server admin or the developer (<@506108777343352881>).`)
            );

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                components: [noSchedulesContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
        } else {
            await interaction.reply({
                components: [noSchedulesContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
        }
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle No Any Schedule Data situation.`);
        console.error(e);
    }

}
