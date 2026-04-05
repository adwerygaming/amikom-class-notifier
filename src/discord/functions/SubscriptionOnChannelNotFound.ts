import { ChatInputCommandInteraction, Colors, ContainerBuilder, GuildBasedChannel, MessageFlags } from "discord.js";
import tags from "../../utils/Tags.js";

export default async function HandleSubscriptionOnChannelNotFound(interaction: ChatInputCommandInteraction, channel: GuildBasedChannel): Promise<void> {
    try {
        const notFoundContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addTextDisplayComponents(t => t.setContent("### Subscription not found"))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(t => t.setContent(`Couldn't find any subscription on <#${channel.id}>. Please make sure you have set up a reminder on that channel before trying to remove it.`));

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                components: [notFoundContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        } else {
            await interaction.reply({
                components: [notFoundContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
        }
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle Unresolvable Channel situation.`);
        console.error(e);
    }
}
