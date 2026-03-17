import { ButtonInteraction, Client, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import { Subscriptions } from "../../amikom/Subscriptions.js";
import { ButtonLayout } from "../../types/Discord.types.js";
import tags from "../../utils/Tags.js";

type UnsubscribeActions = "confirm" | "cancel"

export default {
    id: "unsubscribe",
    execute: async (_client: Client, interaction: ButtonInteraction, data: string[]) => {
        const btnID = data[0] as UnsubscribeActions;

        if (!interaction.guild) {
            const noGuildContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`This command can only be used in a server. Please use this command in a server to subscribe to schedule reminders.`)
                );

            return await interaction.update({
                components: [noGuildContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
        }

        const guildId = interaction.guild.id;
        const subscriptions = new Subscriptions(guildId);

        await interaction.deferUpdate();

        if (btnID === "confirm") {
            try {
                const res = subscriptions.unregister();

                if (!res) {
                    const notSubscribedContainer = new ContainerBuilder()
                        .setAccentColor(Colors.DarkRed)
                        .addTextDisplayComponents(
                            text => text.setContent(`Looks like, **${interaction.guild?.name}** is not subscribed to schedule reminders.`)
                        );

                    return await interaction.editReply({
                        components: [notSubscribedContainer],
                        flags: [MessageFlags.IsComponentsV2],
                    });
                }

                const successContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkPurple)
                    .addTextDisplayComponents(
                        text => text.setContent(`### Successfully Unsubscribed`)
                    )
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent(`**${interaction.guild?.name}** has been unsubscribed from schedule reminders.`)
                    )
                    .addTextDisplayComponents(
                        text => text.setContent(`To subscribe again, use the /reminder subscribe command.`)
                    );

                await interaction.editReply({
                    components: [successContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
            } catch (e) {
                console.log(`[${tags.Error}] ${interaction.guild?.name} - Failed to unsubscribe from schedule reminders.`);
                console.error(e);

                const errorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(
                        text => text.setContent(`### Something went wrong.`)
                    )
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent(`Failed to unsubscribe from schedule reminders. Please try again later.`)
                    )
                    .addTextDisplayComponents(
                        text => text.setContent(`Error: ${e}`)
                    );

                await interaction.editReply({
                    components: [errorContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
            }
        } else if (btnID === "cancel") {
            try {
                await interaction.message.delete();
            } catch {
                return;
            }
        }
    }
} as ButtonLayout;
