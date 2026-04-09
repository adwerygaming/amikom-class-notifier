import { ChatInputCommandInteraction, Client, MessageFlags, SlashCommandBuilder } from "discord.js";
import moment from "moment-timezone";
import { Users } from "../../../amikom/Users.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import { ScheduleContainerBuilder } from "../../functions/ScheduleContainerBuilder.js";
import HandleUserHasNotSetupSchedule from "../../functions/UserHasNotSetupSchedule.js";

const users = new Users();

export default {
    metadata: new SlashCommandBuilder()
        .setName("tomorrow")
        .setDescription("Show your classes scheduled for tomorrow."),
    execute: async (_client: Client, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await HandleNoInteractionGuild(interaction);
            return;
        }

        await interaction.deferReply();

        const user = await users.getByDiscordId(interaction.user.id);
        if (!user) {
            await HandleUserHasNotSetupSchedule(interaction);
            return;
        }

        const now = moment().tz("Asia/Jakarta");
        const todayIdx = now.add(1, "day").day();

        const scheduleBuilder = new ScheduleContainerBuilder(interaction.user, user.id, todayIdx, now);
        const completePack = await scheduleBuilder.build({ withActionButtons: false });

        await interaction.editReply({
            components: completePack,
            flags: [MessageFlags.IsComponentsV2]
        });
    }
} as SlashCommandLayout;
