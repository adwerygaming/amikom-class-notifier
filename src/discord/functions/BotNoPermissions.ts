import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags, PermissionResolvable } from "discord.js";
import { Helper } from "../../amikom/Helper.js";
import tags from "../../utils/Tags.js";

const helper = new Helper();

export default async function HandleBotNoPermissions(interaction: ChatInputCommandInteraction, permissions: PermissionResolvable[]): Promise<void> {
    try {
        const readable = helper.toReadableNames(permissions);
        const permissionList = readable.join(", ");
        const plural = readable.length > 1 ? "s" : "";

        const unauthorizedContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addTextDisplayComponents(
                text => text.setContent("### Missing Access")
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                text => text.setContent(`I don't have permission to use this command. I need ${permissionList} permission${plural} to use this command.`)
            );

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                components: [unauthorizedContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        } else {
            await interaction.reply({
                components: [unauthorizedContainer],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            });
        }
    } catch (e) {
        console.error(`[${tags.Error}] Failed to handle Bot has no required permissions situation.`);
        console.error(e);
    }
}
