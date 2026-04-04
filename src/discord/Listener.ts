import { Colors, EmbedBuilder } from "discord.js";
import moment from "moment-timezone";
import { Helper } from "../amikom/Helper.js";
import { reminderChannelName, ReminderPayload } from "../amikom/Reminder.js";
import { Schedules, StateProp } from "../amikom/Schedules.js";
import redisClient from "../database/RedisClient.js";
import { amikomLogoURL } from "../types/Amikom.types.js";
import tags from "../utils/Tags.js";
import client from "./Client.js";

const helper = new Helper();
const schedules = new Schedules();

export class Listener {
    async start(): Promise<void> {
        await this.check();
    }

    private async check(): Promise<void> {
        const redis = redisClient.duplicate();

        await redis.subscribe(reminderChannelName);

        redis.on("message", (channel, message) => {
            void (async (): Promise<void> => {
                if (channel === reminderChannelName) {
                    if (typeof message !== "string") {
                        console.warn(`[${tags.DiscordListener}] Received non-string message:`, message);
                        return;
                    }

                    let payload: ReminderPayload;

                    try {
                        payload = JSON.parse(message) as ReminderPayload;
                    } catch (e) {
                        console.error(`[${tags.Error}] Failed to parse reminder payload:`);
                        console.error(e);
                        return;
                    }

                    const { data: sch, metadata } = payload;
                    const { subscriptions } = sch;

                    if (subscriptions.length === 0 || !Array.isArray(subscriptions)) {
                        return;
                    }

                    for (const sub of subscriptions) {
                        const now = moment().tz("Asia/Jakarta");

                        const guildId = sub.guildId;
                        const channelId = sub.channelId;

                        const time = sch.Waktu;
                        const { start, end } = helper.resolveClassTime({ time, now });

                        const durationMinutes = end.diff(start, "minutes");
                        const diffInMinutes = Math.max(0, start.diff(now, "minutes"));
                        const startFormatted = start.format("HH:mm");
                        const endFormatted = end.format("HH:mm");
                        const durationFormatted = helper.formatDuration(durationMinutes);
                        const remainingSeconds = end.diff(now, "seconds");
                        const isHappeningNow = metadata.isHappeningNow;

                        const room = sch.Ruang;
                        const { string, type } = helper.resolveRoomCode(room);

                        // overlapping check
                        // TODO: i think it would be better to put this on the pub side insetad of sub side.
                        if (!isHappeningNow) {
                            const isOnGoing = await schedules.isOnGoing({ guildId, userId: sub.userId });
                            if (isOnGoing) {
                                console.log(`[${tags.DiscordListener}] Skipping reminder for user ${sub.userId} in guild ${guildId} because they have an ongoing class.`);
                                continue;
                            }
                        }

                        // state check
                        const stateCheck: StateProp = {
                            eventName: `reminder_${metadata.minutesBefore}`,
                            userId: sub.userId,
                            scheduleId: sch.id,
                            guildId
                        };
                        const alreadyChecked = await schedules.getState(stateCheck);
                        if (alreadyChecked) continue;

                        const reminderEmbed = new EmbedBuilder()
                            .setColor(Colors.Orange)
                            .setTitle(sch.MataKuliah)
                            .setThumbnail(amikomLogoURL)
                            .addFields([
                                {
                                    name: "Time / Duration",
                                    value: `**${startFormatted} - ${endFormatted}** / ${durationFormatted}`,
                                    inline: true
                                },
                                {
                                    name: "Room",
                                    value: `**${room}**\n(${string}) [${type}]`,
                                    inline: true
                                },
                                {
                                    name: "Lecturer",
                                    value: sch.NamaDosen,
                                    inline: true
                                }
                            ]);

                        if (isHappeningNow) {
                            reminderEmbed.setAuthor({ name: `Class is starting now!` });
                        } else {
                            reminderEmbed.setAuthor({ name: `A class will begin in ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}!` });
                        }

                        // send
                        const guild = client.guilds.cache.get(guildId);
                        if (!guild) {
                            console.warn(`[${tags.DiscordListener}] Guild with ID ${guildId} not found.`);
                            continue;
                        }

                        const channel = guild.channels.cache.get(channelId);
                        if (!channel || !channel.isTextBased()) {
                            console.warn(`[${tags.DiscordListener}] Channel with ID ${channelId} not found or is not text-based in guild ${guildId}.`);
                            continue;
                        }

                        try {
                            await channel.send({
                                embeds: [reminderEmbed]
                            });

                            await schedules.setState(stateCheck, true);

                            if (isHappeningNow && remainingSeconds > 0) {
                                await schedules.setOnGoing({ guildId, userId: sub.userId }, remainingSeconds);
                            }
                        } catch (e) {
                            console.error(`[${tags.DiscordListener}] Failed to send reminder message to channel ${channelId} in guild ${guildId}.`);
                            console.error(e);
                        }
                    }
                }
            })();
        });
    }
}
