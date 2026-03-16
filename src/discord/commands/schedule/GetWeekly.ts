import { Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { Helper } from "../../../amikom/Helper.js";
import { ScheduleData } from "../../../amikom/ScheduleData.js";
import { UserClassAssignments } from "../../../amikom/UserClassAssignments.js";
import { amikomLogoURL, ListHari } from "../../../types/Amikom.types.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";

const scheduleData = new ScheduleData()
const helper = new Helper()

export default {
    metadata: new SlashCommandBuilder()
        .setName("weekly")
        .setDescription("Get current schedule data in a week timeframe."),
    async execute(_client, interaction) {
        if (!interaction.guild) {
            const noGuildContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`This command can only be used in a server. Please use this command in a server to subscribe to schedule reminders.`)
                )

            return await interaction.reply({
                components: [noGuildContainer],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            })
        }

        await interaction.deferReply()

        const sserClassAssignments = new UserClassAssignments({
            guildId: interaction.guild.id,
            userId: interaction.user.id
        })

        try {
            const userClass = await sserClassAssignments.fetch()

            if (!userClass) {
                // TODO: setup class prompt
                // to make it reuseable, use the command handler.
                // but you might need to implement context manager
                
                const noUserClassContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(text => text.setContent("### No class assigned"))
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent("You haven't assigned your class yet. Please use the `/schedule set` command to assign your class schedule first.")
                    )

                await interaction.editReply({
                    components: [noUserClassContainer],
                    flags: [MessageFlags.IsComponentsV2],
                })
                return
            }

            const userScheduleId = userClass.schedule_id
            const scheduleLookup = await scheduleData.getById({ id: userScheduleId })

            if (!scheduleLookup) {
                // possible case where there is no schedule data, across all guilds.
                // bcs once a class schedule is registered, it can be used by any guild.
                // maybe promt user to ask admin to add the schedule of their class here?

                const noScheduleDataContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(text => text.setContent("### No schedule data"))
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent("There is no schedule data found matching your assigned class. Please ask your server admin to set the schedule for your class using the `/schedule set` command.")
                    )

                await interaction.editReply({
                    components: [noScheduleDataContainer],
                    flags: [MessageFlags.IsComponentsV2],
                })
                return
            }

            const schedule = scheduleLookup.schedule

            const now = moment().tz("Asia/Jakarta").locale("id")
            const dateFormatted = now.format("dddd, DD MMMM YYYY")

            const grouped = schedule.reduce<Record<string, typeof schedule>>((acc, item) => {
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

            for (const day of dayOrder) {
                const items = grouped[day]
                if (!items?.length) continue

                const baseDay = now.clone().isoWeekday(dayToIso[day])
                const dayDate = baseDay.format("DD MMMM YYYY")
                const isToday = now.isoWeekday() === dayToIso[day]

                const cb = new ContainerBuilder()
                    .setAccentColor(isToday ? Colors.Orange : Colors.DarkPurple)
                    .addTextDisplayComponents(text => text.setContent(`**${day}** - ${dayDate}`))

                const limited = items.slice(0, PER_DAY_LIMIT)
                let nextName: string | null = null
                let nextStart: moment.Moment | null = null
                const classDisplays: string[] = []

                for (const s of limited) {
                    const { start: startTime, end: endTime } = helper.resolveClassTime(now, s.Waktu)
                    const time = `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                    const duration = helper.formatDuration(endTime.diff(startTime, "minutes"))

                    const classStart = baseDay.clone().set({
                        hour: startTime.hour(),
                        minute: startTime.minute(),
                        second: 0,
                        millisecond: 0,
                    })

                    if (isToday && classStart.isAfter(now) && (!nextStart || classStart.isBefore(nextStart))) {
                        nextStart = classStart
                        nextName = s.MataKuliah
                    }

                    classDisplays.push(`> **${s.MataKuliah}**\n> 👤 _${s.NamaDosen}_\n> ⏱️ **${time}** (${duration})\n> 🚪 _${s.Ruang}_`)
                }

                if (isToday && nextStart && nextName) {
                    const countdown = `<t:${nextStart.unix()}:R>`
                    cb.addTextDisplayComponents(text => text.setContent(`**Next: ${nextName} in ${countdown}**`))
                }

                cb.addSeparatorComponents(sep => sep)

                for (const display of classDisplays) {
                    cb.addTextDisplayComponents(text => text.setContent(display))
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
                    text => text.setContent("### Something went wrong")
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