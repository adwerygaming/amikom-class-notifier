import { PermissionResolvable, PermissionsBitField } from "discord.js";

export const toReadableNames = (permissions: PermissionResolvable[]): string[] => {
    const names = new PermissionsBitField(permissions).toArray();
    return names.map(name => name
        .split("_")
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ")
    );
};
