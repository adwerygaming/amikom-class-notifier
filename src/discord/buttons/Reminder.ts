import { Colors, ContainerBuilder, MessageFlags } from "discord.js";
import { Subscriptions } from "../../amikom/Subscriptions.js";
import { ContextManager } from "../../database/ContextManager.js";
import { ButtonLayout } from "../../types/Discord.types.js";
import tags from "../../utils/Tags.js";
import { RemoveSubscriptionContextData } from "../commands/reminder/Remove.js";
import HandleInteractionNoContext from "../functions/InteractionNoContext.js";

type interactionActions = "remove" | "abort"

const subscriptions = new Subscriptions();

export default {
    id: "reminder",
    async execute(_client, interaction, data) {
        const action = data[0] as interactionActions;

        if (action == "remove") {
            const ctxId = data[1];
            const ctxData = await ContextManager.get<RemoveSubscriptionContextData>(ctxId);

            if (!ctxData) {
                await HandleInteractionNoContext(interaction);
                return;
            }

            try {
                const currentSubscriptions = await subscriptions.getByGuildId(ctxData.guildId);
                const sub = currentSubscriptions.find(subscription => subscription.userId === ctxData.userId);

                if (!sub) {
                    const notFoundContainer = new ContainerBuilder()
                        .setAccentColor(Colors.DarkRed)
                        .addTextDisplayComponents(t => t.setContent("### Subscription not found"))
                        .addSeparatorComponents(s => s)
                        .addTextDisplayComponents(t => t.setContent(`Couldn't find your subscription on this channel. It may have already been removed.`));

                    await interaction.update({
                        components: [notFoundContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                    try {
                        await ContextManager.delete(ctxId);
                    } catch (e) {
                        console.error(`[${tags.Error}] Failed to delete context with id ${ctxId}`);
                        console.error(e);
                    }

                    return;
                }

                if (sub.channelId !== ctxData.channelId) {
                    const staleContextContainer = new ContainerBuilder()
                        .setAccentColor(Colors.DarkRed)
                        .addTextDisplayComponents(t => t.setContent("### Reminder changed"))
                        .addSeparatorComponents(s => s)
                        .addTextDisplayComponents(t => t.setContent(`Your reminder channel has changed since this confirmation opened. Please run the remove command again.`));

                    await interaction.update({
                        components: [staleContextContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                    try {
                        await ContextManager.delete(ctxId);
                    } catch (e) {
                        console.error(`[${tags.Error}] Failed to delete context with id ${ctxId}`);
                        console.error(e);
                    }

                    return;
                }

                const removedSub = await subscriptions.remove({
                    guildId: ctxData.guildId,
                    userId: ctxData.userId
                });

                if (!removedSub) {
                    const notFoundContainer = new ContainerBuilder()
                        .setAccentColor(Colors.DarkRed)
                        .addTextDisplayComponents(t => t.setContent("### Subscription not found"))
                        .addSeparatorComponents(s => s)
                        .addTextDisplayComponents(t => t.setContent(`Couldn't find your subscription on this channel. It may have already been removed.`));

                    await interaction.update({
                        components: [notFoundContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                    try {
                        await ContextManager.delete(ctxId);
                    } catch (e) {
                        console.error(`[${tags.Error}] Failed to delete context with id ${ctxId}`);
                        console.error(e);
                    }

                    return;
                }

                const successContainer = new ContainerBuilder()
                    .setAccentColor(Colors.Purple)
                    .addTextDisplayComponents(t => t.setContent("### Subscription removed"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`Your subscription has been successfully removed. You will no longer receive reminders on this channel.`));

                await interaction.update({
                    components: [successContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });

                try {
                    await ContextManager.delete(ctxId);
                } catch (e) {
                    console.error(`[${tags.Error}] Failed to delete context with id ${ctxId}`);
                    console.error(e);
                }
            } catch (e) {
                console.error(`[${tags.Error}] Failed to remove subscription [GID: ${ctxData.guildId} | UID: ${ctxData.userId}]`);
                console.error(e);
                
                const errorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(t => t.setContent("### Failed to remove subscription"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`An error occurred while trying to remove your subscription. Please try again later.`));

                await interaction.update({
                    components: [errorContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });

                try {
                    await ContextManager.delete(ctxId);
                } catch (deleteError) {
                    console.error(`[${tags.Error}] Failed to delete context with id ${ctxId}`);
                    console.error(deleteError);
                }

                return;
            }
        }

        if (action == "abort") {
            const ctxId = data[1];
            const ctxData = await ContextManager.get<RemoveSubscriptionContextData>(ctxId);

            if (!ctxData) {
                await HandleInteractionNoContext(interaction);

                return;
            }

            const abortContainer = new ContainerBuilder()
                .setAccentColor(Colors.Orange)
                .addTextDisplayComponents(t => t.setContent("### Removal Aborted"))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`You have aborted the reminder removal process.`));

            await interaction.update({
                components: [abortContainer],
                flags: [MessageFlags.IsComponentsV2]
            });

            try {
                await ContextManager.delete(ctxId);
            } catch (e) {
                console.error(`[${tags.Error}] Failed to delete context with id ${ctxId}`);
                console.error(e);
            }
        }
    }
} as ButtonLayout;
