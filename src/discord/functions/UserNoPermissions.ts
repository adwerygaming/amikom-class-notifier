import { ChatInputCommandInteraction, Colors, ContainerBuilder, MessageFlags, PermissionResolvable, PermissionsBitField } from "discord.js";

const toReadableNames = (permissions: PermissionResolvable[]): string[] => {
    const names = new PermissionsBitField(permissions).toArray();
    return names.map(name => name
        .split("_")
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ")
    );
};

export default async function HandleUserNoPermissions(interaction: ChatInputCommandInteraction, permissions: PermissionResolvable[]): Promise<void> {
    const readable = toReadableNames(permissions);
    const permissionList = readable.join(", ");
    const plural = readable.length > 1 ? "s" : "";

    const unauthorizedContainer = new ContainerBuilder()
        .setAccentColor(Colors.DarkRed)
        .addTextDisplayComponents(
            text => text.setContent("### Unauthorized")
        )
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`You don't have permission to use this command. You need ${permissionList} permission${plural} to use this command.`)
        );

    await interaction.reply({
        components: [unauthorizedContainer],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
}