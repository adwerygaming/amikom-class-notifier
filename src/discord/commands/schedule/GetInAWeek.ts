import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { Amikom } from "../../../amikom/Amikom.js";
import { Helper } from "../../../amikom/Helper.js";
import { amikomLogoURL, ListHari } from "../../../types/Amikom.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";

const amikom = new Amikom()
const helper = new Helper()

export default {
    metadata: new SlashCommandBuilder()
        .setName("week")
        .setDescription("Get current schedule data in a week timeframe."),
    async execute(_client, interaction) {
        await interaction.deferReply()

        try {
            const schedule = await amikom.readSchedule()

            const now = moment().day(2).tz("Asia/Jakarta").locale("id")
            const dateFormatted = now.format("dddd, DD MMMM YYYY")

            const grouped = schedule.reduce<Record<string, typeof schedule>>( (acc, item) => {
                const key = item.Hari
                acc[key] = acc[key] || []
                acc[key].push(item)
                return acc
            }, {})

            const summary = new ContainerBuilder()
                .setAccentColor(Colors.Purple)
                .addSectionComponents(
                    sec => sec.addTextDisplayComponents(
                        text => text.setContent(`### Class Schedule for this week\nToday is: **${dateFormatted}**`)
                    )
                        .setThumbnailAccessory(
                            img => img.setURL(amikomLogoURL)
                        )
                )

            const dayOrder: ListHari[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"]
            const PER_DAY_LIMIT = 5
            const dayContainers: ContainerBuilder[] = []
            const dayToIso: Record<ListHari, number> = {
                SENIN: 1,
                SELASA: 2,
                RABU: 3,
                KAMIS: 4,
                JUMAT: 5,
            }

            const formatDuration = (minutes: number): string => {
                const hours = Math.floor(minutes / 60)
                const mins = minutes % 60
                const parts = [] as string[]

                if (hours) parts.push(`${hours}h`)
                if (mins) parts.push(`${mins}m`)

                return parts.length ? parts.join(" ") : "0m"
            }

            for (const day of dayOrder) {
                const items = grouped[day]
                if (!items?.length) continue

                const dayDate = now.clone().isoWeekday(dayToIso[day]).format("DD MMMM YYYY")
                const isToday = now.isoWeekday() === dayToIso[day]

                const cb = new ContainerBuilder()
                    .setAccentColor(isToday ? Colors.White : Colors.DarkPurple)
                    .addTextDisplayComponents(text => text.setContent(`**${day}** - ${dayDate}`))
                    .addSeparatorComponents(sep => sep)

                const limited = items.slice(0, PER_DAY_LIMIT)

                for (const s of limited) {
                    const { start: startTime, end: endTime } = helper.resolveClassTime(s.Waktu)
                    const time = `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                    const duration = formatDuration(endTime.diff(startTime, "minutes"))

                    cb.addTextDisplayComponents(text => text.setContent(`> **${s.MataKuliah}**\n> 👤 _${s.NamaDosen}_\n> ⏱️ **${time}** (${duration})\n> 🚪 _${s.Ruang}_`))
                }

                if (items.length > PER_DAY_LIMIT) {
                    cb.addTextDisplayComponents(text => text.setContent(`…and ${items.length - PER_DAY_LIMIT} more`))
                }

                dayContainers.push(cb)
            }

            const components = dayContainers.length
                ? [summary, ...dayContainers]
                : [summary.addTextDisplayComponents(text => text.setContent("_No classes found in the schedule. Please set it with /schedule set._"))]

            await interaction.editReply({
                components,
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