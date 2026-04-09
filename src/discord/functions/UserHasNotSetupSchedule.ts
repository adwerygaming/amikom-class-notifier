import { ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import tags from "../../utils/Tags.js";

export default async function HandleUserHasNotSetupSchedule(interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<void> {
    try {
        const submitClassInfoBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_start`)
            .setLabel("Submit Class Information")
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📚');

        const hasNotSetupScheduleContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addTextDisplayComponents(
                t => t.setContent(`### No Schedule Data Found`)
            )
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(
                t => t.setContent(`**Looks like you haven't setup your schedule data yet.**`)
            )
            .addSectionComponents(
                s => s.addTextDisplayComponents(
                    t => t.setContent(`To continue, **you need to submit your class information and schedule data first** using this button.`)
                )
                    .setButtonAccessory(() => submitClassInfoBtn)
            );


        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                components: [hasNotSetupScheduleContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        } else {
            await interaction.reply({
                components: [hasNotSetupScheduleContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle User has not setup schedule situation.`);
        console.error(e);
    }
}
