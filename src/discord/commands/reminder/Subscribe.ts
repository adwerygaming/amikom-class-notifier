import {
    ActionRowBuilder,
    ComponentType,
    MessageFlags,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";
import { ScheduleData } from "../../../amikom/ScheduleData.js";
import { Subscriptions } from "../../../amikom/Subscriptions.js";
import { SlashCommandLayout } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";

const scheduleData = new ScheduleData()

const TIMEOUT = 60_000;

interface UserFilterIteration {
    user: {
        id: string
    }
}

export default {
    metadata: new SlashCommandBuilder()
        .setName("subscribe")
        .setDescription("Subscribe to schedule reminders.")
        .addChannelOption(
            ch => ch.setName("channel")
                .setDescription("The channel to send reminders to. If not specified, reminders will be sent to the current channel.")
                .setRequired(false)
        ),
    async execute(_client, interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        // Capture channel early — stays in scope for the entire wizard
        const targetChannel = interaction.options.getChannel("channel") ?? interaction.channel;
        if (!targetChannel) {
            await interaction.reply({ content: "Could not resolve target channel.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        const userId = interaction.user.id;
        const filter = (i: UserFilterIteration): boolean => i.user.id === userId;

        const allClasses = await scheduleData.getAll();
        if (!allClasses.length) {
            await interaction.reply({
                content: "No class schedules exist yet. Use `/schedule set` first.",
                flags: [MessageFlags.Ephemeral],
            });
            return;
        }

        const majors = [...new Set(allClasses.map(c => c.major))].sort();
        const majorSelect = new StringSelectMenuBuilder()
            .setCustomId("step_major")
            .setPlaceholder("Select your major")
            .addOptions(majors.map(m =>
                new StringSelectMenuOptionBuilder().setLabel(m).setValue(m)
            ));

        const reply = await interaction.reply({
            content: `**Step 1/3** — Select major for <#${targetChannel.id}>:`,
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(majorSelect)],
            flags: [MessageFlags.Ephemeral],
        });

        let step1;
        try {
            step1 = await reply.awaitMessageComponent({ componentType: ComponentType.StringSelect, filter, time: TIMEOUT });
        } catch {
            await interaction.editReply({ content: "Timed out. Run `/subscribe` again.", components: [] });
            return;
        }
        const chosenMajor = step1.values[0];

        const years = [...new Set(
            allClasses.filter(c => c.major === chosenMajor).map(c => c.entry_year)
        )].sort((a, b) => b - a); // newest first

        const yearSelect = new StringSelectMenuBuilder()
            .setCustomId("step_year")
            .setPlaceholder("Select your enrolled year")
            .addOptions(years.map(y =>
                new StringSelectMenuOptionBuilder().setLabel(String(y)).setValue(String(y))
            ));

        await step1.update({
            content: `**Step 2/3** — Select enrolled year for **${chosenMajor}**:`,
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(yearSelect)],
        });

        let step2;
        try {
            step2 = await reply.awaitMessageComponent({ componentType: ComponentType.StringSelect, filter, time: TIMEOUT });
        } catch {
            await interaction.editReply({ content: "Timed out. Run `/subscribe` again.", components: [] });
            return;
        }
        const chosenYear = Number(step2.values[0]);

        const classOptions = allClasses.filter(
            c => c.major === chosenMajor && c.entry_year === chosenYear
        );

        const classSelect = new StringSelectMenuBuilder()
            .setCustomId("step_class")
            .setPlaceholder("Select your class")
            .addOptions(classOptions.map(c =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Class ${c.class_number}`)
                    .setValue(`${c.class_number}`)
            ));

        await step2.update({
            content: `**Step 3/3** — Select class for **${chosenMajor} ${chosenYear}**:`,
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(classSelect)],
        });

        let step3;
        try {
            step3 = await reply.awaitMessageComponent({ componentType: ComponentType.StringSelect, filter, time: TIMEOUT });
        } catch {
            await interaction.editReply({ content: "Timed out. Run `/subscribe` again.", components: [] });
            return;
        }

        const chosenClass = step3.values[0];

        const finalScheduleData = classOptions.find(c => String(c.class_number) === chosenClass);

        if (!finalScheduleData) {
            console.log(`[${tags.Error}] no final schedul data. [major: ${chosenMajor}, year: ${chosenYear}, class: ${chosenClass}]`);
            return;
        }

        const subscriptions = new Subscriptions(interaction.guild.id);

        await subscriptions.register({
            channel_id: targetChannel.id,
            user_id: userId,
            schedule_id: finalScheduleData.id,
            mentions: [] // TODO: allow users to specify mention preferences in the future
        });

        await step3.update({
            content: `✅ **Subscribed!** Reminders for **${chosenMajor} ${chosenYear} Class ${chosenClass}** will be posted in <#${targetChannel.id}>.`,
            components: [],
        });
    }
} as SlashCommandLayout