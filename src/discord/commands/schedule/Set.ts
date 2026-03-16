import axios from "axios";
import { Colors, ContainerBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import z from "zod";
import { Helper } from "../../../amikom/Helper.js";
import { ScheduleData } from "../../../amikom/ScheduleData.js";
import { classScheduleSchema, ListHari } from "../../../types/Amikom.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";

const scheduleData = new ScheduleData()
const helper = new Helper()

export default {
    metadata: new SlashCommandBuilder()
        .setName("set")
        .setDescription("Set schedule data.")
        .addStringOption(option =>
            option.setName('major') // TODO: make autocomplete system for this one
                .setDescription('Your major (e.g., Sistem Informasi)')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('entry_year')
                .setDescription('Your entry year (e.g., 2026)')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('class_number')
                .setDescription('Your class number (e.g., 04)')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Upload the schedule file (.json format recommended)')
                .setRequired(true)
    ),
    async execute(_client, interaction) {
        const file = interaction.options.getAttachment("file")
        let major = interaction.options.getString("major", true)
        const entryYear = interaction.options.getInteger("entry_year", true)
        const classNumber = interaction.options.getInteger("class_number", true)

        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction)
            return
        }

        // beautify
        major = helper.capitalizeWords(major.trim())

        if (entryYear < 2000) {
            const uncContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Invalid Entry Year")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("The entry year you provided seems way too old to be valid. Please check and try again.")
                )

            await interaction.reply({
                components: [uncContainer],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            })
            return
        }

        const currentYear = new Date().getFullYear()
        if (entryYear > currentYear) {
            const timeTravelerContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Invalid Entry Year")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("The entry year you provided is in the future. Are you a time traveler? Please check and try again.")
                )

            await interaction.reply({
                components: [timeTravelerContainer],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            })
            return
        }

        if (classNumber <= 0) {
            const invalidClassContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Invalid Class Number")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Class number must be a positive integer. Please check and try again.")
                )

            await interaction.reply({
                components: [invalidClassContainer],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            })
            return
        }

        // Admin permission check
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            const unauthorizedContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Unauthorized")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("You don't have permission to use this command. You need **Manage Server** permission to use this command.")
                )

            await interaction.reply({
                components: [unauthorizedContainer],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            })
            return
        }

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
                flags: [MessageFlags.IsComponentsV2],
            })
            return
        }

        const ALLOWED_TYPES = ["application/json", "text/plain"];
        if (!file.contentType || !ALLOWED_TYPES.some(t => file?.contentType?.startsWith(t))) {
            const invalidTypeContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### Unsupported File Type")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("The uploaded file type is not supported. Please upload a JSON file containing the schedule data.")
                )

            await interaction.reply({
                components: [invalidTypeContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
            return
        }

        const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
        if (file.size > MAX_BYTES) {
            const tooLargeContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(
                    text => text.setContent("### File Too Large")
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("The uploaded file is too large. Please upload a file smaller than 2 MB.")
                )

            await interaction.reply({
                components: [tooLargeContainer],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            })
            return;
        }

        await interaction.deferReply()

        // TODO: look up for any security measures here
        try {
            let rawSchedule: unknown
            const res = await axios.get(file.url, {
                timeout: 10000,
                responseType: "text",
                maxBodyLength: MAX_BYTES,
                maxContentLength: MAX_BYTES
            })

            try {
                rawSchedule = JSON.parse(res.data)
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
            const { success, data, error } = scheduleSchema.safeParse(rawSchedule)

            if (!success) {
                console.error(error)
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

           await scheduleData.set({
                major,
                class_number: classNumber,
                entry_year: entryYear,
                schedule: data
            })

            // Preview: summary container + one container per day (compact)
            const grouped = data.reduce<Record<string, typeof data>>((acc, item) => {
                const key = item.Hari
                acc[key] = acc[key] || []
                acc[key].push(item)
                return acc
            }, {})

            const dayOrder: ListHari[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"]
            const summary = new ContainerBuilder()
                .setAccentColor(Colors.Green)
                .addTextDisplayComponents(text => text.setContent("### Schedule Updated"))
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(text => text.setContent("Schedule has been successfully updated! Here's a preview of the schedule:"))
                .addTextDisplayComponents(
                    text => text.setContent(`Major: **${major}**\nEntry Year: **${entryYear}**\nClass Number: **${classNumber}**`)
                )

            const dayContainers: ContainerBuilder[] = []
            const PER_DAY_LIMIT = 5

            for (const day of dayOrder) {
                const items = grouped[day]
                if (!items?.length) continue

                const cb = new ContainerBuilder()
                    .setAccentColor(Colors.Purple)
                    .addTextDisplayComponents(text => text.setContent(`**${day}**`))
                    .addSeparatorComponents(sep => sep)

                const limited = items.slice(0, PER_DAY_LIMIT)
                for (const s of limited) {
                    cb.addTextDisplayComponents(text => text.setContent(`> **${s.MataKuliah}**\n> _${s.NamaDosen}_\n> ${s.Waktu}\n> _${s.Ruang}_`))
                }

                if (items.length > PER_DAY_LIMIT) {
                    cb.addTextDisplayComponents(text => text.setContent(`…and ${items.length - PER_DAY_LIMIT} more`))
                }

                dayContainers.push(cb)
            }

            const components = dayContainers.length
                ? [summary, ...dayContainers]
                : [summary.addTextDisplayComponents(text => text.setContent("_No classes found in the schedule. If this seems wrong, please file an issue on GitHub._"))]

            await interaction.editReply({
                components,
                flags: [MessageFlags.IsComponentsV2]
            })
        } catch (e) {
            console.error(`[${tags.Error}] Failed to fetch or process the schedule file from the provided URL.`)
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