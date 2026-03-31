import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Users } from "../../../amikom/Users.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";

const users = new Users();

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
                t => t.setContent(`## Schedule Setup`)
            )
            .addSeparatorComponents(
                s => s
            );

        if (user) {
            menuContainer
                .addTextDisplayComponents(
                    t => t.setContent(`You already configured your class before.`)
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
                .addTextDisplayComponents(
                    t => t.setContent(`If you want to update your class information, please click the button below to restart the setup process.`)
                )
                .addActionRowComponents(
                    r => r.addComponents(openModalBtn)
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
            flags: [MessageFlags.IsComponentsV2]
        });
    }
} as SlashCommandLayout;