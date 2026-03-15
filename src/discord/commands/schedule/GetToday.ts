import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js"
import moment from "moment-timezone"
import { Amikom } from "../../../amikom/Amikom.js"
import { Helper } from "../../../amikom/Helper.js"
import { amikomLogoURL, ListHari } from "../../../types/Amikom.types.js"
import { SlashCommandLayout } from "../../../types/Discord.types.js"

const amikom = new Amikom()
const helper = new Helper()

export default {
    metadata: new SlashCommandBuilder()
        .setName("today")
        .setDescription("Get today's schedule."),
    async execute(_client, interaction) {
        await interaction.deferReply()

        try {
            const schedule = await amikom.readSchedule()
            const now = moment().tz("Asia/Jakarta").locale("id")
            const isoDay = now.isoWeekday()
            const isoToDay: Record<number, ListHari> = {
                1: "SENIN",
                2: "SELASA",
                3: "RABU",
                4: "KAMIS",
                5: "JUMAT",
            }

            const todayKey = isoToDay[isoDay]
            const items = todayKey ? schedule.filter(item => item.Hari === todayKey) : []
            const dateSummaryFormatted = now.format("dddd, DD MMMM YYYY")
            const todayDateFormatted = now.format("DD MMMM YYYY")
            const fallbackTodayKey = now.format("dddd").toUpperCase()

            const summary = new ContainerBuilder()
                .setAccentColor(Colors.Purple)
                .addSectionComponents(
                    sec => sec.addTextDisplayComponents(
                        text => text.setContent(`### Today's Classes\nToday is: **${dateSummaryFormatted}**`)
                    )
                        .setThumbnailAccessory(img => img.setURL(amikomLogoURL))
                )

            const dayContainer = new ContainerBuilder()
                .setAccentColor(Colors.Orange)
                .addTextDisplayComponents(text => text.setContent(`**${todayKey || fallbackTodayKey}** - ${todayDateFormatted}`))

            if (!items.length) {
                dayContainer.addSeparatorComponents(sep => sep)
                dayContainer.addTextDisplayComponents(text => text.setContent("You have no classes today."))

                await interaction.editReply({
                    components: [summary, dayContainer],
                    flags: [MessageFlags.IsComponentsV2],
                })
                return
            }

            let nextName: string | null = null
            let nextStart: moment.Moment | null = null
            const classDisplays: string[] = []

            const formatDuration = (minutes: number): string => {
                const hours = Math.floor(minutes / 60)
                const mins = minutes % 60
                const parts = [] as string[]

                if (hours) parts.push(`${hours}h`)
                if (mins) parts.push(`${mins}m`)

                return parts.length ? parts.join(" ") : "0m"
            }

            for (const s of items) {
                const { start: startTime, end: endTime } = helper.resolveClassTime(s.Waktu)
                const time = `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                const duration = formatDuration(endTime.diff(startTime, "minutes"))

                const classStart = now.clone().set({
                    hour: startTime.hour(),
                    minute: startTime.minute(),
                    second: 0,
                    millisecond: 0,
                })

                if (classStart.isAfter(now) && (!nextStart || classStart.isBefore(nextStart))) {
                    nextStart = classStart
                    nextName = s.MataKuliah
                }

                classDisplays.push(`> **${s.MataKuliah}**\n> 👤 _${s.NamaDosen}_\n> ⏱️ **${time}** (${duration})\n> 🚪 _${s.Ruang}_`)
            }

            if (nextStart && nextName) {
                const countdown = `<t:${nextStart.unix()}:R>`
                dayContainer.addTextDisplayComponents(text => text.setContent(`**Next: ${nextName} in ${countdown}**`))
            }

            dayContainer.addSeparatorComponents(sep => sep)

            for (const display of classDisplays) {
                dayContainer.addTextDisplayComponents(text => text.setContent(display))
            }

            await interaction.editReply({
                components: [summary, dayContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        } catch (e) {
            console.error(e)
            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(text => text.setContent("### Something went wrong"))
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent("Failed to read schedule data. Please make sure you have set the schedule using `/schedule set` command.")
                )

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2],
            })
        }
    }
} as SlashCommandLayout
