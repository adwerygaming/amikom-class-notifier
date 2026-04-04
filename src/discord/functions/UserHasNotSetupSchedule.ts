import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags } from "discord.js";

export default async function HandleUserHasNotSetupSchedule(interaction: ChatInputCommandInteraction): Promise<void> {
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
                t => t.setContent(`To use the schedule command, **you need to submit your class information & schedule data first** by using this button.`)
            )
                .setButtonAccessory(() => submitClassInfoBtn)
        );

    await interaction.reply({
        components: [hasNotSetupScheduleContainer],
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
    });
}
