import { ChannelType, ChatInputCommandInteraction, Client, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { Users } from "../../../amikom/Users.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";
import HandleBotNoPermissions from "../../functions/BotNoPermissions.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleUnresolvableChannel from "../../functions/UnresolveableChannel.js";
import HandleUserHasNotSetupSchedule from "../../functions/UserHasNotSetupSchedule.js";

const subscriptions = new Subscriptions();
const users = new Users();

export default {
    metadata: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Setup reminder channel")
        .addChannelOption(ch =>
            ch.setName("reminder_channel")
                .setDescription("The channel where the reminder will be sent")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        ),
    execute: async (_client: Client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        const channelInput = interaction.options.getChannel("reminder_channel", true);
        const channel = interaction.guild.channels.cache.get(channelInput.id);

        if (!channel) {
            await HandleUnresolvableChannel(interaction);
            return;
        }

        const botUser = interaction.guild.members.me;
        if (!botUser) {
            await HandleUnresolvableChannel(interaction);
            return;
        }

        const botPermissions = channel.permissionsFor(botUser);
        if (!botPermissions || !botPermissions.has(["ViewChannel", "SendMessages"])) {
            await HandleBotNoPermissions(interaction, ["ViewChannel", "SendMessages"]);
            return;
        }

        // 1 channel = 1 reminder rule.
        const subs = await subscriptions.getByGuildId(interaction.guild.id);
        const existing = subs.find(sub => sub.channelId === channel.id);

        if (existing) {
            await interaction.reply({
                content: `This channel is already set as reminder channel.`,
                ephemeral: true,
            });
            return;
        }

        const user = await users.getByDiscordId(interaction.user.id);

        if (!user) {
            await HandleUserHasNotSetupSchedule(interaction);
            return;
        }

        try {
            const sub = await subscriptions.add(user.id, {
                guildId: interaction.guild.id,
                channelId: channel.id
            });

            // channel test
            try {
                if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
                    await HandleUnresolvableChannel(interaction);
                    return;
                }

                const notifyContainer = new ContainerBuilder()
                    .setAccentColor(Colors.Purple)
                    .addTextDisplayComponents(t => t.setContent(`<@${user.userId}> has configured this channel as class reminder. I will start sending reminders here.`));

                await channel.send({
                    components: [notifyContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            } catch (e) {
                console.error(`[${tags.Error}] Failed to fetch channel [GID: ${interaction.guild.id} | CID: ${sub.channelId}]`);
                console.error(e);

                await HandleUnresolvableChannel(interaction);
                return;
            }

            const successContainer = new ContainerBuilder()
                .setAccentColor(Colors.Purple)
                .addTextDisplayComponents(t => t.setContent("### Subscription successful"))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`Successfully set <#${sub.channelId}> as the reminder channel.`));

            await interaction.reply({
                components: [successContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        } catch (e) {
            console.error(`[${tags.Error}] Failed to set up reminder channel [GID: ${interaction.guild.id} | CID: ${channel.id} | UID: ${interaction.user.id}]`);
            console.error(e);
            
            await interaction.reply({
                content: `An error occurred while setting up the reminder channel. Please try again later.`,
                ephemeral: true,
            });
        }
    }
} as SlashCommandLayout;
