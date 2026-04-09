import { ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import { BaseContext, ContextManager } from "../../database/ContextManager.js";
import { ModalLayout } from "../../types/Discord.types.js";

export interface ScheduleSetupUserInfoContextData extends BaseContext {
    major: string
    classNumber: number
    entryYear: number
}

export default {
    id: "scheduleClassInfo",
    async execute(_client, interaction) {
        if (!interaction.isFromMessage()) return;

        const major = interaction.fields.getTextInputValue("major");
        const classNumber = interaction.fields.getTextInputValue("classNumber");
        const entryYear = interaction.fields.getTextInputValue("entryYear");

        const ctxData: ScheduleSetupUserInfoContextData = {
            executorUserId: interaction.user.id,
            major,
            classNumber: parseInt(classNumber),
            entryYear: parseFloat(entryYear)
        };

        const ctxId = await ContextManager.create(ctxData);

        const tryAgainBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_start_${ctxId}`)
            .setLabel("Try again")
            .setStyle(ButtonStyle.Primary);

        if (major.length == 0 || classNumber.length == 0 || entryYear.length == 0 || isNaN(parseInt(classNumber)) || isNaN(parseFloat(entryYear))) {
            const badRequestContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(t => t.setContent(`### Bad Input`))
                .addSeparatorComponents(s => s)
                .addSectionComponents(
                    s => s.addTextDisplayComponents(t => t.setContent(`**Invalid Input**: Make sure you have filled all the required fields properly.`))
                        .setButtonAccessory(() => tryAgainBtn)
                );

            await interaction.update({
                components: [badRequestContainer],
                flags: [MessageFlags.IsComponentsV2]
            });

            try {
                await ContextManager.delete(ctxId);
            } catch {
                // Context cleanup is best-effort here.
            }

            return;
        }

        const yesBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_confirm_${ctxId}`)
            .setLabel("Yes, that is correct.")
            .setStyle(ButtonStyle.Success);

        const noBtn = tryAgainBtn
            .setLabel("No, I would like to restart.")
            .setStyle(ButtonStyle.Secondary);

        const confirmContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkPurple)
            .addTextDisplayComponents(t => t.setContent(`### Confirm`))
            .addTextDisplayComponents(t => t.setContent(`Please check again your data below. Make sure it's correct.`))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(t => t.setContent(`Major: **${major}**`))
            .addTextDisplayComponents(t => t.setContent(`Class Number: **${classNumber}**`))
            .addTextDisplayComponents(t => t.setContent(`Entry Year: **${entryYear}**`))
            .addTextDisplayComponents(t => t.setContent(`> You are in ${major} ${classNumber}, joined Amikom on ${entryYear}`))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(r => r.addComponents(yesBtn, noBtn));

        await interaction.update({
            components: [confirmContainer],
            flags: [MessageFlags.IsComponentsV2]
        });
    },
} as ModalLayout;
