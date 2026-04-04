import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Users } from "../../../amikom/Users.js";
import { ContextManager } from "../../../database/ContextManager.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import { ScheduleSetupUserInfoContextData } from "../../modals/ScheduleClassInfo.js";

const users = new Users();

/**
 * Initiates the initial UI flow to upload and populate schedule data
 * attached for a specific Discord user interaction.
 */
export default {
    metadata: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Setup your schedule data"),
    execute: async (_client: Client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        const user = await users.getByDiscordId(interaction.user.id);

        const openModalBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_start`)
            .setLabel("Submit Class Information")
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📚');

        const menuContainer = new ContainerBuilder()
            .setAccentColor(Colors.Purple)
            .addTextDisplayComponents(
                t => t.setContent(`### Schedule Setup`)
            )
            .addSeparatorComponents(
                s => s
        );

        if (user) {
            const ctxData: ScheduleSetupUserInfoContextData = {
                executorUserId: interaction.user.id,
                major: user.major,
                classNumber: user.class_number,
                entryYear: user.entry_year
            };

            const ctxId = await ContextManager.create(ctxData);

            const setupScheduleBtn = new ButtonBuilder()
                .setCustomId(`schedule_${interaction.user.id}_confirm_${ctxId}`)
                .setLabel("Change Schedule Data")
                .setEmoji("📚")
                .setStyle(ButtonStyle.Success);

            const updateClassBtn = openModalBtn.setLabel("Update Class Information");

            menuContainer
                .addTextDisplayComponents(
                    t => t.setContent(`**You already configured your class before.**`)
                )
                .addTextDisplayComponents(
                    t => t.setContent(`Major: **${user.major}**`)
                )
                .addTextDisplayComponents(
                    t => t.setContent(`Class Number: **${user.class_number}**`)
                )
                .addTextDisplayComponents(
                    t => t.setContent(`Entry Year: **${user.entry_year}**`)
                )
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(
                    t => t.setContent(`- If you want to update your class information, click **Update Class Information**.\n- If you want to just update your schedules, click **Change Schedule Data**.`)
                )
                .addActionRowComponents(
                    r => r.addComponents(updateClassBtn, setupScheduleBtn)
                );
        } else {
            menuContainer
                .addTextDisplayComponents(
                    t => t.setContent(`Click the button below to submit your class information.`)
                )
                .addActionRowComponents(
                    r => r.addComponents(openModalBtn)
                );
        }

        await interaction.reply({
            components: [menuContainer],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
        });
    }
} as SlashCommandLayout;
