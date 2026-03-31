import { ChannelType, ChatInputCommandInteraction, Client, SlashCommandBuilder } from "discord.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleBotNoPermissions from "../../functions/BotNoPermissions.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleUnresolvableChannel from "../../functions/UnresolveableChannel.js";

const subscriptions = new Subscriptions();

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

        await interaction.reply({
            content: `Successfully set the reminder channel to ${channel}.`,
            ephemeral: true,
        });
    }
} as SlashCommandLayout;
