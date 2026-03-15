import { Colors, EmbedBuilder, MessageCreateOptions, MessagePayload } from "discord.js"
import moment from "moment-timezone"
import { Helper } from "../amikom/Helper.js"
import { CheckReminderResponse } from "../amikom/Reminder.js"
import { Subscriptions } from "../amikom/Subscriptions.js"
import redisClient from "../database/RedisClient.js"
import { ReminderEvent } from "../types/ACN.types.js"
import { amikomLogoURL } from "../types/Amikom.types.js"
import tags from "../utils/Tags.js"
import client from "./Client.js"

const sub = redisClient.duplicate()
const helper = new Helper()

export class Listener {
    async start(): Promise<void> {
        const subscribedEvents = [
            ReminderEvent.StartingNow,
            ReminderEvent.In5Minutes,
            ReminderEvent.In10Minutes,
            ReminderEvent.In15Minutes,
            ReminderEvent.In30Minutes,
            ReminderEvent.In1Hour,
        ]

        console.log(`[${tags.DiscordListener}] Subscribed to ${subscribedEvents.length} reminder events: ${subscribedEvents.join(", ")}`)

        await sub.subscribe(
            ...subscribedEvents
        )

        // channel = ReminderEvent
        // message = CheckReminderResponse
        sub.on("message", async (channel: ReminderEvent, message: string) => {
            console.log(`[${tags.DiscordListener}] Received reminder event ${channel}`)
            // parsing the content
            let data: CheckReminderResponse

            try {
                data = JSON.parse(message) as CheckReminderResponse
            } catch (e) {
                console.error(`[${channel}] Failed to parse message:`, e)
                return
            }

            const schedule = data.schedule
            // const nextSchedule = data.nextSchedule

            const now = moment().tz("Asia/Jakarta")
            const { start, end } = helper.resolveClassTime(now, schedule.Waktu)
            const duration = helper.formatDuration(end.diff(start, "minutes"))

            try {
                if (channel === ReminderEvent.StartingNow) {
                    const startingNowEmbed = new EmbedBuilder()
                        .setColor(Colors.Orange)
                        .setTitle(`Class Starting Now`)
                        .setDescription(`**${schedule.MataKuliah}** (_${schedule.Kode}_) is starting now.`)
                        .setThumbnail(amikomLogoURL)
                        .addFields(
                            {
                                name: "Lecturer",
                                value: schedule.NamaDosen || "N/A",
                                inline: true,
                            },
                            {
                                name: "Time / Duration",
                                value: `${start.format("HH:mm")} - ${end.format("HH:mm")} (${duration})`,
                                inline: true,
                            },
                            {
                                name: "Room",
                                value: schedule.Ruang || "N/A",
                                inline: true,
                            }
                        );

                    await this.sendMessage({ embeds: [startingNowEmbed] })
                } else {
                    const diffFromNow = start.diff(now, "minutes")

                    const comingEmbed = new EmbedBuilder()
                        .setColor(Colors.Orange)
                        .setTitle(`Class in ${diffFromNow} minutes`)
                        .setDescription(`**${schedule.MataKuliah}** (_${schedule.Kode}_) will start in **${diffFromNow} minutes**.`)
                        .setThumbnail(amikomLogoURL)
                        .addFields(
                            {
                                name: "Lecturer",
                                value: schedule.NamaDosen || "N/A",
                                inline: true,
                            },
                            {
                                name: "Time / Duration",
                                value: `${start.format("HH:mm")} - ${end.format("HH:mm")} (${duration})`,
                                inline: true,
                            },
                            {
                                name: "Room",
                                value: schedule.Ruang || "N/A",
                                inline: true,
                            }
                        );

                    await this.sendMessage({ embeds: [comingEmbed] })
                }
            } catch (e) {
                console.log(`[${tags.Error}] Failed to send reminder message:`)
                console.error(e)
            }
        })
    }

    private async sendMessage(content: string | MessagePayload | MessageCreateOptions): Promise<void> {
        const allGuilds = await Subscriptions.fetchAllGuilds()
        const allDestinations = allGuilds.map(g => {
            return {
                guild_id: g.guild_id,
                channel_id: g.channel_id,
                is_active: g.is_active,
                mentions: g.mentions,
            }
        })

        try {
            for (const destination of allDestinations) {
                if (!destination.is_active) continue

                const guild_id = destination.guild_id
                const channelId = destination.channel_id

                const guild = client.guilds.cache.get(guild_id)
                if (!guild) {
                    console.error(`[${tags.Error}] Guild with ID ${guild_id} not found in cache.`)
                    continue
                }

                const channel = guild.channels.cache.get(channelId)

                if (!channel) {
                    console.error(`[${tags.Error}] Channel with ID ${channelId} not found in guild ${guild_id}.`)
                    continue
                }

                if (channel.isTextBased()) {
                    console.log(`[${tags.Reminder}] Sending ${channel} reminder to ${guild.name}`)
                    await channel.send(content)
                }
            }
        } catch (e) {
            console.log(`[${tags.Error}] Failed to send reminder messages:`)
            console.error(e)
        }
    }
}