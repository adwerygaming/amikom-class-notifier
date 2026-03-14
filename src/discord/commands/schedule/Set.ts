import axios from "axios";
import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import z from "zod";
import { Amikom } from "../../../amikom/Amikom.js";
import { classScheduleSchema } from "../../../types/Amikom.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";

const amikom = new Amikom()

export default {
    metadata: new SlashCommandBuilder()
        .setName("set")
        .setDescription("Set schedule data.")
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Upload the schedule file (.json format recommended)')
                .setRequired(true)
        ),
    async execute(_client, interaction) {
        const file = interaction.options.getAttachment("file")

        if (!file) {
            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Bad Request")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("**No file attachment found.** Please upload the schedule file on option `file`.")
                )

            await interaction.reply({
                components: [errorContainer],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            })
            return
        }

        await interaction.deferReply()

        // TODO: look up for any security measures here
        try {
            const res = await axios.get(file.url)
            let rawSchedule: unknown

            try {
                rawSchedule = JSON.parse(JSON.stringify(res.data))
            } catch {
                const notInShapeContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(
                        text => text.setContent("### Invalid JSON Format")
                    )
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent("The uploaded file is not in valid JSON format. Please upload a valid JSON file.")
                    )

                await interaction.editReply({
                    components: [notInShapeContainer],
                    flags: [MessageFlags.IsComponentsV2]
                })
                return
            }

            const scheduleSchema = z.array(classScheduleSchema)
            const schedule = scheduleSchema.safeParse(rawSchedule)

            if (!schedule.success) {
                console.error(schedule?.error)
                const invalidFormatContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(
                        text => text.setContent("### Invalid Schedule Format")
                    )
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent("The schedule appears to be in an invalid format. Please check the file and try again.")
                    )

                await interaction.editReply({
                    components: [invalidFormatContainer],
                    flags: [MessageFlags.IsComponentsV2]
                })
                return
            }

            await amikom.writeSchedule(JSON.stringify(schedule.data))

            const formattedSchedule = schedule.data.map(s => `- [**${s.Hari}**] **${s.MataKuliah}** at **${s.Waktu}** (_${s.NamaDosen}_)`).join("\n")

            const successContainer = new ContainerBuilder()
                .setAccentColor(Colors.Green)
                .addTextDisplayComponents(
                    text => text.setContent("### Schedule Updated")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Schedule has been successfully updated!")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Your schedule for this semester:")
                )
                .addTextDisplayComponents(
                    text => text.setContent(formattedSchedule ?? "_No classes found in the schedule. This is an error btw, Please submit issues on GitHub_")
                )

            await interaction.editReply({
                components: [successContainer],
                flags: [MessageFlags.IsComponentsV2]
            })
        } catch (e) {
            console.log(`[${tags.Error}] Failed to fetch or process the schedule file from the provided URL.`)
            console.error(e)
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Error Processing File")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Something went wrong while fetching or processing the schedule file. Please ensure the file is accessible and in the correct format, then try again.")
                )

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2]
            })
        }
    },
} as SlashCommandLayout