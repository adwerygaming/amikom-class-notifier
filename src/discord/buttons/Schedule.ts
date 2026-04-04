import { ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, FileUploadBuilder, LabelBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Users } from "../../amikom/Users.js";
import { ContextManager } from "../../database/ContextManager.js";
import { ButtonLayout } from "../../types/Discord.types.js";
import tags from "../../utils/Tags.js";
import HandleInteractionNoContext from "../functions/InteractionNoContext.js";
import { ScheduleSetupUserInfoContextData } from "../modals/ScheduleClassInfo.js";

type interactionActions = "start" | "confirm" | "submitFile"

const users = new Users();

export default {
    id: "schedule",
    async execute(_client, interaction, data) {
        const action = data[0] as interactionActions;

        if (action == "start") {
            const ctxId = data[1];

            if (ctxId) {
                await ContextManager.delete(ctxId);
            }

            const majorInput = new TextInputBuilder()
                .setCustomId("major")
                .setRequired(true)
                .setPlaceholder("(e.g: Sistem Informasi)")
                .setStyle(TextInputStyle.Short)
                .setValue("Sistem Informasi");

            const majorLabel = new LabelBuilder()
                .setLabel("Your Major")
                .setTextInputComponent(majorInput);

            const classNumberInput = new TextInputBuilder()
                .setCustomId("classNumber")
                .setRequired(true)
                .setPlaceholder("(e.g: 04 (in Sistem Informasi 04)")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(2)
                .setValue("04");

            const classNumberLabel = new LabelBuilder()
                .setLabel("Class Number")
                .setTextInputComponent(classNumberInput);

            const entryYearInput = new TextInputBuilder()
                .setCustomId("entryYear")
                .setRequired(true)
                .setPlaceholder("(e.g: 2025 (Joined Amikom in 2025)")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(4)
                .setValue("2025");

            const entryYearLabel = new LabelBuilder()
                .setLabel("Your Entry Year")
                .setTextInputComponent(entryYearInput);

            const modal = new ModalBuilder()
                .setTitle("Class Info Submission")
                .setCustomId(`scheduleClassInfo_${interaction.user.id}_classInfoInput`)
                .addLabelComponents(majorLabel, classNumberLabel, entryYearLabel);

            await interaction.showModal(modal);
        }

        if (action == "confirm") {
            const ctxId = data[1];
            const ctx = await ContextManager.get<ScheduleSetupUserInfoContextData>(ctxId);

            if (!ctx) {
                await HandleInteractionNoContext(interaction);
                return;
            }

            try {
                await users.assignClass(ctx.executorUserId, {
                    class_number: ctx.classNumber,
                    entry_year: ctx.entryYear,
                    major: ctx.major
                });

                const amikomDashboardBtn = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Dashboard Mahasiswa")
                    .setURL("https://mhs.amikom.ac.id");

                const amikomApiBtn = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Jadwal Kuliah API")
                    .setURL("https://mhs.amikom.ac.id/api/perkuliahan/jadwal_kuliah_personal");

                const submissionBtn = new ButtonBuilder()
                    .setCustomId(`schedule_${interaction.user.id}_submitFile`)
                    .setLabel("Submit Schedule File")
                    .setStyle(ButtonStyle.Primary);

                // might need to re-phrase this instruction later, make it more simple and easy to understand.
                const instructions = [
                    "Click the **Dashboard Mahasiswa** button below to open dashboard mahasiswa",
                    "Login with your **Amikomm ID**",
                    "When dashboard page comes up, open https://mhs.amikom.ac.id/api/perkuliahan/jadwal_kuliah_personal on new tab. Or you can click the **Jadwal Kuliah API** button below.",
                    "You should see a bunch of JSON Data, If you didn't see it or get `Authorization has been denied for this request.` message. Make sure you opened the link on same browser instance.",
                    "Copy all the JSON DATA with `CTRL + A` then `CTRL + C` into your clipboard (**DO NOT save the page as .html file**)",
                    "Open a text editor like **notepad**, paste the content there.",
                    "Save it as something like `schedule.txt` somewhere on your computer.",
                    "After that, click the **Submit File** button below and upload the file you just saved containing the JSON data of your schedule."
                ];

                const savedContainer = new ContainerBuilder()
                    .setAccentColor(Colors.Purple)
                    .addTextDisplayComponents(
                        t => t.setContent("### Schedule Setup")
                    )
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(
                        t => t.setContent("Please upload your schedule following instructions below.")
                    )
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(
                        t => t.setContent("Instructions:")
                    )
                    .addTextDisplayComponents(
                        t => t.setContent(instructions.map((x, i) => `${i + 1}. ${x}`).join("\n"))
                    )
                    .addSeparatorComponents(s => s)
                    .addActionRowComponents(r => r.addComponents(submissionBtn, amikomDashboardBtn, amikomApiBtn));

                await interaction.update({
                    components: [savedContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
                // saved the user class info. next is to do their schedule data.
            } catch {
                const failToAssignContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(
                        t => t.setContent(`## Something went wrong`)
                    )
                    .addSeparatorComponents(s => s)
                    .addTextDisplayComponents(
                        t => t.setContent(`Failed to assign <@${ctx.executorUserId}> to their class. Try again later.`)
                    );
                await interaction.update({
                    components: [failToAssignContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }

            try {
                await ContextManager.delete(ctxId);
            } catch (e) {
                console.error(`[${tags.Error}] Failed to delete context with id ${ctxId}`);
                console.error(e);
            }
        }

        if (action == "submitFile") {
            const scheduleFileInput = new FileUploadBuilder()
                .setCustomId("scheduleFile")
                .setMinValues(1)
                .setMaxValues(1)
                .setRequired(true);

            const scheduleFileLabel = new LabelBuilder()
                .setLabel("Schedule file")
                .setFileUploadComponent(scheduleFileInput);

            const modal = new ModalBuilder()
                .setTitle("Schedule Upload")
                .setCustomId(`scheduleFileUpload_${interaction.user.id}_scheduleInput`)
                .addLabelComponents(scheduleFileLabel);

            await interaction.showModal(modal);
        }
    },
} as ButtonLayout;
