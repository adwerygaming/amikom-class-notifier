import { ButtonBuilder } from "@discordjs/builders";
import axios from "axios";
import { ButtonStyle, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import { Schedules } from "../../amikom/Schedules.js";
import { Users } from "../../amikom/Users.js";
import { ClassSchedule, classSchedulesSchema } from "../../types/Amikom.types.js";
import { ModalLayout } from "../../types/Discord.types.js";
import tags from "../../utils/Tags.js";

const users = new Users();
const schedules = new Schedules();

export default {
    id: "scheduleFileUpload",
    async execute(_client, interaction) {
        if (!interaction.isFromMessage()) return;

        const [uploadedFiles] = interaction.fields.getUploadedFiles("scheduleFile", true);

        const scheduleFile = uploadedFiles?.[1] ?? null;

        const tryAgainBtn = new ButtonBuilder()
            .setCustomId(`schedule_${interaction.user.id}_submitFile`)
            .setLabel("Try again")
            .setStyle(ButtonStyle.Primary);

        if (!scheduleFile) {
            const noFileContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(t => t.setContent("### No File Uploaded"))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`You haven't uploaded any file. Please upload your schedule file to proceed.`))
                .addTextDisplayComponents(t => t.setContent(`Make sure the file is in the correct format as specified in the instructions.`))
                .addSeparatorComponents(s => s)
                .addActionRowComponents(r => r.addComponents(tryAgainBtn));

            await interaction.update({
                components: [noFileContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
            return;
        }

        const url = scheduleFile.url;

        // this part should be defered but idk it wont work, it says "he reply to this interaction has already been sent or deferred."
        // but i think it dosent matter. the file is small anyway (assume if user send correct file. since there is no validation on the modal itself.)

        try {
            const { data: res, status, statusText } = await axios.get<ClassSchedule[]>(url, {
                responseType: "json",
                validateStatus: () => true,
                timeout: 10000
            });

            if (status != 200) {
                const errorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(t => t.setContent("### Something went wrong"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`Error while fetching your schedule file, expected **OK (200)** but got **${statusText} (${status})** response insetad.`))
                    .addTextDisplayComponents(t => t.setContent("Please try again later."))
                    .addSeparatorComponents(s => s)
                    .addActionRowComponents(r => r.addComponents(tryAgainBtn));

                await interaction.update({
                    components: [errorContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            // validate schedule data
            const validation = classSchedulesSchema.safeParse(res);

            if (!validation.success) {
                const errors = validation.error.issues.map(x => `- ${x.message}`).join("\n");
                const validationErrorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(t => t.setContent("### Invalid Schedule Data"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`The schedule data in the file you uploaded is not in the correct format.`))
                    .addTextDisplayComponents(t => t.setContent(`Errors:\n\`\`\`${errors}\`\`\``))
                    .addTextDisplayComponents(t => t.setContent("Please try again."))
                    .addSeparatorComponents(s => s)
                    .addActionRowComponents(r => r.addComponents(tryAgainBtn));

                await interaction.update({
                    components: [validationErrorContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            const user = await users.getByDiscordId(interaction.user.id);

            if (!user) {
                const userNotFoundContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(t => t.setContent("### User Not Found"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`We couldn't find your user data in our database. Please make sure you have submitted your class information first before uploading your schedule.`))
                    .addTextDisplayComponents(t => t.setContent("Please try again after submitting your class information."))
                    .addSeparatorComponents(s => s)
                    .addActionRowComponents(r => r.addComponents(tryAgainBtn));

                await interaction.update({
                    components: [userNotFoundContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            try {
                await schedules.set(user.id, validation.data);

                const completeContainer = new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents(t => t.setContent("### Schedule Uploaded Successfully"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`Your schedule has been uploaded and saved successfully.`));

                await interaction.update({
                    components: [completeContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            } catch (e) {
                console.error(`[${tags.Error}] Failed to save schedule for user [UID: ${user.id}]`);
                console.error(e);

                const errorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(t => t.setContent("### Error"))
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(t => t.setContent(`An error occurred while saving your schedule. Please try again later.`))
                    .addSeparatorComponents(s => s)
                    .addActionRowComponents(r => r.addComponents(tryAgainBtn));

                await interaction.update({
                    components: [errorContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }
        } catch {
            console.error(`[${tags.Error}] Failed to process schedule file for user [UID: ${interaction.user.id}]`);

            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addTextDisplayComponents(t => t.setContent("### Something went wrong"))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent(`An error occurred while processing your schedule file. Please try again later.`))
                .addSeparatorComponents(s => s)
                .addActionRowComponents(r => r.addComponents(tryAgainBtn));

            await interaction.update({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    }
} as ModalLayout;
