import { ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, Client, Colors, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { Users } from "../../../amikom/Users.js";
import { BaseContext, ContextManager } from "../../../database/ContextManager.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleSubscriptionOnChannelNotFound from "../../functions/SubscriptionOnChannelNotFound.js";
import HandleUnresolvableChannel from "../../functions/UnresolveableChannel.js";
import HandleUserHasNotSetupSchedule from "../../functions/UserHasNotSetupSchedule.js";

const subscriptions = new Subscriptions();
const users = new Users();

export interface RemoveSubscriptionContextData extends BaseContext {
    guildId: string;
    userId: string
}

export default {
    metadata: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove a reminder channel from this server.")
        .addChannelOption(ch =>
            ch.setName("reminder_channel")
                .setDescription("Choose the reminder channel to remove. Defaults to the current channel.")
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

        try {
            await interaction.deferReply();

            const user = await users.getByDiscordId(interaction.user.id);
            if (!user) {
                await HandleUserHasNotSetupSchedule(interaction);
                return;
            }

            const subs = await subscriptions.getByGuildId(interaction.guild.id);
            const existing = subs.find(sub =>
                sub.userId === user.id && sub.channelId === channel.id
            );

            if (!existing) {
                await HandleSubscriptionOnChannelNotFound(interaction, channel);
                return;
            }

            const removeSubscriptionContextData: RemoveSubscriptionContextData = {
                executorUserId: interaction.user.id,
                userId: existing.userId,
                guildId: interaction.guild.id
            };

            const ctxId = await ContextManager.create(removeSubscriptionContextData);

            const unsubscribeBtn = new ButtonBuilder()
                .setCustomId(`reminder_${interaction.user.id}_remove_${ctxId}`)
                .setLabel("Remove Reminder")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🗑️");

            const abortBtn = new ButtonBuilder()
                .setCustomId(`reminder_${interaction.user.id}_abort_${ctxId}`)
                .setLabel("Abort")
                .setStyle(ButtonStyle.Secondary);

            const confirmRemovalContainer = new ContainerBuilder()
                .setAccentColor(Colors.Orange)
                .addTextDisplayComponents(t => t.setContent("### Confirm Removal"))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`**Are you sure, you want to remove reminder on <#${channel.id}> ?**`))
                .addTextDisplayComponents(t => t.setContent(`If you **remove** this reminder, you will no longer receive notifications about your class as below:`))
                .addTextDisplayComponents(t => t.setContent(`- Major: **${user.major}**\n- Class Number: **${user.class_number}**\n- Entry Year: **${user.entry_year}**`))
                .addSeparatorComponents(s => s)
                .addActionRowComponents(r => r.addComponents(unsubscribeBtn, abortBtn));

            await interaction.editReply({
                components: [confirmRemovalContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        } catch (e) {
            console.error(`[${tags.Error}] Failed to remove reminder channel [GID: ${interaction.guild.id} | CID: ${channel.id} | UID: ${interaction.user.id}]`);
            console.error(e);

            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(t => t.setContent("### Failed to remove reminder channel"))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`An error occurred while removing the reminder channel. Please try again later.`));

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    }
} as SlashCommandLayout;
