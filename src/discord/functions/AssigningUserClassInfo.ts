import { ChatInputCommandInteraction, Colors, ComponentType, ContainerBuilder, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { ScheduleData } from "../../amikom/ScheduleData.js";
import { UserClassAssignments } from "../../amikom/UserClassAssignments.js";
import { ScheduleDataSchema } from "../../types/Database.types.js";
import { UserFilterIteration } from "../../types/Discord.types.js";
import tags from "../../utils/Tags.js";
import HandleNoInteractionGuild from "./NoInteractionGuild.js";

type AssignUserClassInfoResults = Pick<ScheduleDataSchema, "major" | "entry_year" | "class_number"> & { scheduleId: string } | null

export default async function HandleAssigningUserClassInfo(interaction: ChatInputCommandInteraction): Promise<AssignUserClassInfoResults> {
    if (!interaction.guild) {
        await HandleNoInteractionGuild(interaction);
        return null;
    }

    await interaction.deferReply();

    const scheduleData = new ScheduleData();
    const userClassAssignments = new UserClassAssignments({
        guildId: interaction.guild.id,
        userId: interaction.user.id
    });

    const schedules = await scheduleData.getAll();
    const majors = schedules.map((x) => x.major);

    const TIMEOUT = 60_000;
    const filter = (i: UserFilterIteration): boolean => i.user.id === interaction.user.id;
    const timeoutContainer = new ContainerBuilder()
        .setAccentColor(Colors.DarkRed)
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`Too late. Please run the command again.`)
        );

    const majorOptions = majors.slice(0, 25).map(m => {
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(m)
            .setValue(m);
        return option;
    });

    const majorSelect = new StringSelectMenuBuilder()
        .setCustomId("step_major_cmdhdlrignore")
        .setPlaceholder("Select your major")
        .addOptions(majorOptions)
        .setMaxValues(1);

    const step1Container = new ContainerBuilder()
        .setAccentColor(Colors.DarkPurple)
        .addTextDisplayComponents(
            text => text.setContent(`### Class Assignment`)
        )
        .addTextDisplayComponents(
            text => text.setContent(`-# Step 1 out of 3`)
        )
        .addTextDisplayComponents(
            text => text.setContent(`To use this command, you need to assign your class information first. Don't worry, this is a one-time setup. Let's get started!`)
        )
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`Please **select your major.**`)
    )
        .addActionRowComponents(
            row => row.addComponents(majorSelect)
        )
        .addTextDisplayComponents(
            text => text.setContent(`-# If your option isn't listed, please contact an admin.`)
        );

    await interaction.editReply({
        components: [step1Container],
        flags: [MessageFlags.IsComponentsV2],
    });
    const reply = await interaction.fetchReply();

    let step1;
    try {
        step1 = await reply.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            filter,
            time: TIMEOUT
        });
    } catch {
        await interaction.editReply({
            components: [timeoutContainer],
        });
        return null;
    }

    const chosenMajor = step1.values[0];

    const availableYears = [...new Set(
        schedules.filter(c => c.major === chosenMajor).map(c => c.entry_year)
    )].sort((a, b) => b - a);

    const yearsOptions = availableYears.slice(0, 25).map(y => {
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(String(y))
            .setValue(String(y));
        return option;
    });

    const yearSelect = new StringSelectMenuBuilder()
        .setCustomId("step_year_cmdhdlrignore")
        .setPlaceholder("Select your enrolled year")
        .addOptions(yearsOptions)
        .setMaxValues(1);

    const step2Container = new ContainerBuilder()
        .setAccentColor(Colors.DarkPurple)
         .addTextDisplayComponents(
             text => text.setContent(`### Class Assignment`)
         )
        .addTextDisplayComponents(
            text => text.setContent(`-# Step 2 out of 3`)
        )
        .addTextDisplayComponents(
            text => text.setContent(`Major: **${chosenMajor}**`)
        )
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`Next, **select your enrolled year.**`)
        )
        .addActionRowComponents(
            row => row.addComponents(yearSelect)
        )
        .addTextDisplayComponents(
            text => text.setContent(`-# If your option isn't listed, please contact an admin.`)
        );

    await step1.update({
        components: [step2Container],
        flags: [MessageFlags.IsComponentsV2],
    });

    let step2;
    try {
        step2 = await reply.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            filter,
            time: TIMEOUT
        });
    } catch {
        await interaction.editReply({
            components: [timeoutContainer],
        });
        return null;
    }

    const chosenYear = Number(step2.values[0]);

    const availableClasses = schedules.filter(
        c => c.major === chosenMajor && c.entry_year === chosenYear
    );

    const classOptions = availableClasses.slice(0, 25).map(c => {
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(`${chosenMajor} ${c.class_number}`)
            .setValue(`${c.class_number}`);
        return option;
    });

    const classSelect = new StringSelectMenuBuilder()
        .setCustomId("step_class_cmdhdlrignore")
        .setPlaceholder("Select your class")
        .addOptions(classOptions)
        .setMaxValues(1);

    const step3Container = new ContainerBuilder()
        .setAccentColor(Colors.DarkPurple)
        .addTextDisplayComponents(
            text => text.setContent(`### Class Assignment`)
        )
        .addTextDisplayComponents(
            text => text.setContent(`-# Step 3 out of 3`)
        )
        .addTextDisplayComponents(
            text => text.setContent(`Major: **${chosenMajor}** | Year: **${chosenYear}**`)
        )
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`Last, **select your class number.**`)
        )
        .addActionRowComponents(
            row => row.addComponents(classSelect)
        )
        .addTextDisplayComponents(
            text => text.setContent(`-# If your option isn't listed, please contact an admin.`)
        );

    await step2.update({
        components: [step3Container],
        flags: [MessageFlags.IsComponentsV2],
    });

    let step3;
    try {
        step3 = await reply.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            filter,
            time: TIMEOUT
        });
    } catch {
        await interaction.editReply({
            content: null,
            components: [timeoutContainer],
        });
        return null;
    }

    const chosenClass = step3.values[0];

    const finalScheduleData = availableClasses.find(c => String(c.class_number) === chosenClass);

    if (!finalScheduleData) {
        console.log(`[${tags.Error}] No final schedule data. [major: ${chosenMajor}, year: ${chosenYear}, class: ${chosenClass}]`);

        const errorContainer = new ContainerBuilder()
            .setAccentColor(Colors.DarkRed)
            .addTextDisplayComponents(
                text => text.setContent(`**Couldn't find schedule data for the selected class.** Please try again or contact an admin.`)
            );

        await step3.update({
            components: [errorContainer],
            flags: [MessageFlags.IsComponentsV2],
        });
        return null;
    }

    await userClassAssignments.assign(finalScheduleData.id);

    const noUserClassContainer = new ContainerBuilder()
        .setAccentColor(Colors.DarkRed)
        .addTextDisplayComponents(text => text.setContent("### Class Assigned"))
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(
            text => text.setContent(`You have assigned to **${finalScheduleData.major} ${finalScheduleData.entry_year} ${finalScheduleData.class_number}**.`)
        )
        .addTextDisplayComponents(
            text => text.setContent(`Please re-run the command you intended to use.`)
        );

    await interaction.editReply({
        components: [noUserClassContainer],
        flags: [MessageFlags.IsComponentsV2],
    });

    return {
        scheduleId: finalScheduleData.id,
        class_number: finalScheduleData.class_number,
        entry_year: finalScheduleData.entry_year,
        major: finalScheduleData.major,
    };
}