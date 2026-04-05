import { ChannelType, ChatInputCommandInteraction, Client, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { Users } from "../../../amikom/Users.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";
import HandleBotNoPermissions from "../../functions/BotNoPermissions.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleSubscriptionOnChannelNotFound from "../../functions/SubscriptionOnChannelNotFound.js";
import HandleUnresolvableChannel from "../../functions/UnresolveableChannel.js";
import HandleUserHasNotSetupSchedule from "../../functions/UserHasNotSetupSchedule.js";

const subscriptions = new Subscriptions();
const users = new Users();

export default {
    metadata: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Set a reminder channel for class notifications.")
        .addChannelOption(ch =>
            ch.setName("reminder_channel")
                .setDescription("Choose the text or announcement channel to send class reminders to.")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)
        ),
    execute: async (_client: Client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        const channelInput = interaction.options.getChannel("reminder_channel", false);
        const channels = interaction.guild.channels.cache;
        const channelId = channelInput?.id || interaction.channel?.id;

        if (!channelId) {
            await HandleUnresolvableChannel(interaction);
            return;
        }

        const channel = channels.get(channelId);
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
        if (!botPermissions.has(["ViewChannel", "SendMessages"])) {
            await HandleBotNoPermissions(interaction, ["ViewChannel", "SendMessages"]);
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            // 1 channel = 1 reminder rule.
            const subs = await subscriptions.getByGuildId(interaction.guild.id);
            const existing = subs.find(sub => sub.channelId === channel.id);

            if (!existing) {
                await HandleSubscriptionOnChannelNotFound(interaction, channel);
                return;
            }

            const user = await users.getByDiscordId(interaction.user.id);

            if (!user) {
                await HandleUserHasNotSetupSchedule(interaction);
                return;
            }

            const sub = await subscriptions.add(user.id, {
                guildId: interaction.guild.id,
                channelId: channel.id
            });

            const successContainer = new ContainerBuilder()
                .setAccentColor(Colors.Purple)
                .addTextDisplayComponents(t => t.setContent("### Subscription successful"))
                .addTextDisplayComponents(t => t.setContent(`**You have successfully set <#${sub.channelId}> as your reminder channel.** I Will start sending reminders from now on.`))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`- Major: **${user.major}**\n- Class Number: **${user.class_number}**\n- Entry Year: **${user.entry_year}**`))
                .addSeparatorComponents(s => s);

            await interaction.editReply({
                components: [successContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        } catch (e) {
            console.error(`[${tags.Error}] Failed to set up reminder channel [GID: ${interaction.guild.id} | CID: ${channel.id} | UID: ${interaction.user.id}]`);
            console.error(e);

            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(t => t.setContent("### Failed to set up reminder channel"))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`An error occurred while setting up the reminder channel. Please try again later.`));

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    }
} as SlashCommandLayout;
