import { Colors, ComponentType, ContainerBuilder, MessageFlags, PermissionFlagsBits, SelectMenuComponentOptionData, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { SlashCommandLayout, UserFilterIteration } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleUserNoPermissions from "../../functions/UserNoPermissions.js";

const TIMEOUT = 60_000;

export default {
    metadata: new SlashCommandBuilder()
        .setName("unsubscribe")
        .setDescription("Unsubscribe from schedule reminders."),
    async execute(_client, interaction) {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        // Admin permission check
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await HandleUserNoPermissions(interaction, ["ManageGuild"]);
            return;
        }

        const executorId = interaction.user.id;
        const filter = (i: UserFilterIteration): boolean => i.user.id === executorId;
        const timeoutContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent(`Too late. Please run the command again.`)
            );

        await interaction.deferReply();

        const subscriptions = new Subscriptions(interaction.guild.id);

        try {
            const guildSubscriptions = await subscriptions.fetch(true);

            if (!guildSubscriptions || guildSubscriptions.length === 0) {
                const notSubscribedContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkPurple)
                    .addTextDisplayComponents(
                        text => text.setContent(`**${interaction.guild?.name}** is currently **not subscribed** to any class schedule reminders.`)
                    );

                return await interaction.editReply({
                    components: [notSubscribedContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
            }

            // 25 is discord's max options for select menu
            const options = guildSubscriptions?.slice(0, 25).map(s => {
                const sch = s.schedule_data;
                const channel = interaction.guild?.channels.cache.get(s.channel_id);
                const scheduleLabel = sch
                    ? `${sch.entry_year} ${sch.major} ${sch.class_number}`
                    : "schedule unavailable";
                const channelLabel = channel?.name ? `${channel?.name} -` : "";

                return {
                    label: `${channelLabel} ${scheduleLabel}`,
                    description: `Subscribed on ${new Date(s.created_at).toLocaleString()}`,
                    value: s.id,
                } as SelectMenuComponentOptionData;
            });

            const menu = new StringSelectMenuBuilder()
                .setCustomId("unsubscribe_menu_cmdhdlrignore")
                .setPlaceholder("Select a subscription to unsubscribe")
                .addOptions(options)
                .setMaxValues(1)
                .setMinValues(1);

            const selectionContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkPurple)
                .addTextDisplayComponents(
                    text => text.setContent(`### Unsubscribe from Schedule Reminders`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`Please select the subscription you want to unsubscribe from the dropdown menu below.`)
                )
                .addSeparatorComponents(sep => sep)
                .addActionRowComponents(
                    row => row.addComponents(menu)
                );

            await interaction.editReply({
                components: [selectionContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
            const selectionInteraction = await interaction.fetchReply();

            let selectionReply;
            try {
                selectionReply = await selectionInteraction.awaitMessageComponent({
                    componentType: ComponentType.StringSelect,
                    filter,
                    time: TIMEOUT
                });
            } catch {
                await interaction.editReply({
                    components: [timeoutContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
                return;
            }

            const selectionIntValue = selectionReply.values[0];
            const selection = guildSubscriptions?.find(s => s.id === selectionIntValue);

            if (!selection) {
                const notFoundContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent(`**Selected subscription not found.** Already deleted? Please try again.`)
                    );

                await selectionReply.update({
                    components: [notFoundContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
                return;
            }

            try {
                const res = await subscriptions.unregister(selection.id);

                const successContainer = new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents(
                        text => text.setContent(`### Subscription successfully deleted.`)
                    )
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent(`I will no longer send schedule reminders to <#${res.channel_id}>.`)
                    )
                    .addTextDisplayComponents(
                        text => text.setContent(`-# Re-subscribe anytime by running the \`/subscribe\` command.`)
                    );

                await selectionReply.update({
                    components: [successContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
            } catch (e) {
                console.error(`[${tags.Error}] Failed to delete subscription:`);
                console.error(e);

                const errorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent(`Failed to unsubscribe from the selected schedule. Please try again.`)
                    );

                await selectionReply.update({
                    components: [errorContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
                return;
            }
        } catch (e) {
            console.error(`[${tags.Error}] Failed to fetch subscriptions:`);
            console.error(e);

            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`Failed to fetch subscriptions. Please try again later.`)
                );

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
        }
    }
} as SlashCommandLayout;