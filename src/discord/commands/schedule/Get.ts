import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { Amikom } from "../../../amikom/Amikom.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";

const amikom = new Amikom()

export default {
    metadata: new SlashCommandBuilder()
        .setName("get")
        .setDescription("Get current schedule data."),
    async execute(_client, interaction) {
        await interaction.deferReply()

        try {
            const schedule = await amikom.readSchedule()

            const now = moment().tz("Asia/Jakarta")
            const dateFormatted = now.format("dddd, DD MMMM YYYY")

            const scheduleContainer = new ContainerBuilder()
                .setAccentColor(Colors.Purple)
                .addTextDisplayComponents(
                    text => text.setContent(`### Class Schedule for today`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`${dateFormatted}`)
                )
                .addSeparatorComponents(sep => sep)

            for (const s of schedule) {
                scheduleContainer.addTextDisplayComponents(
                    text => text.setContent(`- [**${s.Hari}**] **${s.MataKuliah}** at **${s.Waktu}** (_${s.NamaDosen}_)`)
                )
            }

            await interaction.editReply({
                components: [scheduleContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        } catch (e) {
            console.error(e)
            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Error")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Failed to read schedule data. Please make sure you have set the schedule using `/schedule set` command.")
                )

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
            return
        }
    }
} as SlashCommandLayout