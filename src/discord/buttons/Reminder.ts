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

        console.log(data);

        if (action == "remove") {
            const ctxId = data[1];
            const ctxData = await ContextManager.get<RemoveSubscriptionContextData>(ctxId);

            if (!ctxData) {
                await HandleInteractionNoContext(interaction);
                return;
            }

            console.log(ctxData);

            try {
                const sub = await subscriptions.remove({
                    guildId: ctxData.guildId,
                    userId: ctxData.userId
                });

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
            } catch (e) {
                console.error(`[${tags.Error}] Failed to remove subscription [GID: ${ctxData.guildId} | UID: ${ctxData.userId}]`);
                console.error(e);
                
                const errorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(t => t.setContent("### Failed to remove subscription"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`An error occurred while trying to remove your subscription. Please try again later.`));

                await interaction.editReply({
                    components: [errorContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
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
        }
    }
} as ButtonLayout;
