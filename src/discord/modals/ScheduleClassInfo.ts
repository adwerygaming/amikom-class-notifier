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

        const major = await interaction.fields.getTextInputValue("major");
        const classNumber = await interaction.fields.getTextInputValue("classNumber");
        const entryYear = await interaction.fields.getTextInputValue("entryYear");

        if (major.length == 0 || classNumber.length == 0 || entryYear.length == 0) {
            const badRequestContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    t => t.setContent(`## Bad Input`)
                )
                .addSeparatorComponents(
                    s => s
                )
                .addTextDisplayComponents(
                    t => t.setContent(`**Invalid Input**: Make sure you have filled all the required fields properly.`)
                )
                .addTextDisplayComponents(
                    t => t.setContent(`Re-run the command to try again.`)
            );

            await interaction.update({
                components: [badRequestContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
            return;
        }

        const ctxData: ScheduleSetupUserInfoContextData = {
            executorUserId: interaction.user.id,
            major,
            classNumber: parseInt(classNumber),
            entryYear: parseFloat(entryYear)
        };

        const ctxId = await ContextManager.create<ScheduleSetupUserInfoContextData>(ctxData);

        const yesBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_confirm_${ctxId}`)
            .setLabel("Yes, that is correct.")
            .setStyle(ButtonStyle.Success);

        const noBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_start`)
            .setLabel("No, I would like to restart.")
            .setStyle(ButtonStyle.Secondary);

        const confirmContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkPurple)
            .addTextDisplayComponents(
                t => t.setContent(`## Confirm`)
            )
            .addTextDisplayComponents(
                t => t.setContent(`Please check again your data below. Make sure it's correct.`)
            )
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(
                t => t.setContent(`Major: **${major}**`)
            )
            .addTextDisplayComponents(
                t => t.setContent(`Class Number: **${classNumber}**`)
            )
            .addTextDisplayComponents(
                t => t.setContent(`Entry Year: **${entryYear}**`)
            )
            .addTextDisplayComponents(
                t => t.setContent(`> You are in ${major} ${classNumber}, joined Amikom on ${entryYear}`)
            )
            .addSeparatorComponents(s => s)
            .addActionRowComponents(
                r => r.addComponents(yesBtn, noBtn)
            );

        await interaction.update({
            components: [confirmContainer],
            flags: [MessageFlags.IsComponentsV2]
        });
    },
} as ModalLayout;