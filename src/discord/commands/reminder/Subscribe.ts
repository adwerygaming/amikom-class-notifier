import { Colors, ComponentType, ContainerBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { ScheduleData } from "../../../amikom/ScheduleData.js";
import { DuplicateSubscriptionError, InvalidSubscriptionDataError, Subscriptions } from "../../../amikom/Subscriptions.js";
import { SlashCommandLayout, UserFilterIteration } from "../../../types/Discord.types.js";
import tags from "../../../utils/Tags.js";
import HandleNoInteractionGuild from "../../functions/NoInteractionGuild.js";
import HandleUserNoPermissions from "../../functions/UserNoPermissions.js";

const scheduleData = new ScheduleData();

const TIMEOUT = 60_000;

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
            await HandleNoInteractionGuild(interaction);
            return;
        }

        // Admin permission check
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await HandleUserNoPermissions(interaction, ["ManageGuild"]);
            return;
        }

        const targetChannel = interaction.options.getChannel("channel") ?? interaction.channel;
        if (!targetChannel) {
            const noChannelContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`**Couldn't resolve target channel.** Make sure the channel is valid and I have access to it.`)
                );

            await interaction.reply({
                components: [noChannelContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
            return;
        }

        await interaction.deferReply();

        const subscriptions = new Subscriptions(interaction.guild.id);

        try {
            const userId = interaction.user.id;

            //! for check only executor can interact with the select menu
            //! no need ephemeral
            // turns out this filter just ignores the non executor. maybe thats ok for now.
            const filter = (i: UserFilterIteration): boolean => i.user.id === userId;

            const allClasses = await scheduleData.getAll();
            if (!allClasses.length) {
                const noSchedulesContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent(`**I don't have any schedules data for any class yet.** Ask your admin to add schedule data using the \`/schedule set\` command first.`)
                    );

                await interaction.editReply({
                    components: [noSchedulesContainer],
                    flags: [MessageFlags.IsComponentsV2],
                });
                return;
            }

            const timeoutContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`Too late. Please run the command again.`)
                );

            // TODO: implement context manager and move this on each file for better reuse and readability.

            const availableMajors = [...new Set(
                allClasses.map(c => c.major)
            )].sort();

            const majorOptions = availableMajors.slice(0, 25).map(m => {
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
                    text => text.setContent(`-# Step 1 out of 3`)
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`Please **select your major.**`)
                )
                .addActionRowComponents(
                    row => row.addComponents(majorSelect)
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
                return;
            }

            const chosenMajor = step1.values[0];

            const availableYears = [...new Set(
                allClasses.filter(c => c.major === chosenMajor).map(c => c.entry_year)
            )].sort((a, b) => b - a); // newest first

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
                    text => text.setContent(`-# Step 2 out of 3`)
            )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`Next, **select your enrolled year.**`)
            )
                .addActionRowComponents(
                    row => row.addComponents(yearSelect)
                );

            await step1.update({
                components: [step2Container],
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
                return;
            }
            const chosenYear = Number(step2.values[0]);

            const availableClasses = allClasses.filter(
                c => c.major === chosenMajor && c.entry_year === chosenYear
            );

            const classOptions = availableClasses.slice(0, 25).map(c => {
                const option = new StringSelectMenuOptionBuilder()
                    .setLabel(`Class ${c.class_number}`)
                    .setValue(`${chosenMajor} ${c.class_number}`);
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
                    text => text.setContent(`-# Step 3 out of 3`)
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`Last, **select your class number.**`)
                )
                .addActionRowComponents(
                    row => row.addComponents(classSelect)
                );

            await step2.update({
                components: [step3Container],
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
                return;
            }

            const chosenClass = step3.values[0];

            const finalScheduleData = availableClasses.find(c => String(c.class_number) === chosenClass);

            if (!finalScheduleData) {
                console.log(`[${tags.Error}] No final schedule data. [major: ${chosenMajor}, year: ${chosenYear}, class: ${chosenClass}]`);

                const errorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addSeparatorComponents(sep => sep)
                    .addTextDisplayComponents(
                        text => text.setContent(`**Couldn't find schedule data for the selected class.** Please try again or contact an admin.`)
                    );

                await step3.update({
                    components: [errorContainer],
                });
                return;
            }

            try {
                await subscriptions.register({
                    channel_id: targetChannel.id,
                    user_id: userId,
                    schedule_id: finalScheduleData.id,
                    mentions: [] // TODO: allow users to specify mention preferences in the future
                });
            } catch (e) {
                if (e instanceof DuplicateSubscriptionError) {
                    const alreadyExistsContainer = new ContainerBuilder()
                        .setAccentColor(Colors.DarkRed)
                        .addTextDisplayComponents(
                            text => text.setContent(`**<#${targetChannel.id}>** is already subscribed to a different schedule. Please choose another channel.`)
                        );

                    await step3.update({
                        components: [alreadyExistsContainer],
                    });
                    return;
                }

                if (e instanceof InvalidSubscriptionDataError) {
                    const invalidDataContainer = new ContainerBuilder()
                        .setAccentColor(Colors.DarkRed)
                        .addTextDisplayComponents(
                            text => text.setContent(`**Invalid subscription data.** Please try again or contact an admin.`)
                        );

                    await step3.update({
                        components: [invalidDataContainer],
                    });
                    return;
                }

                console.error(`[${tags.Error}] Failed to register subscription`, e);

                const genericErrorContainer = new ContainerBuilder()
                    .setAccentColor(Colors.DarkRed)
                    .addTextDisplayComponents(
                        text => text.setContent(`**An unexpected error occurred while subscribing.** Please try again or contact an admin.`)
                    );

                await step3.update({
                    components: [genericErrorContainer],
                });
                return;
            }

            const subscribedContainer = new ContainerBuilder()
                .setAccentColor(Colors.Green)
                .addTextDisplayComponents(
                    text => text.setContent(`### Subscription successful!`)
                )
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`<#${targetChannel.id}> has been assigned as a class reminder for **${chosenYear} ${chosenMajor} ${chosenClass}**.`)
            )
                .addTextDisplayComponents(
                    text => text.setContent(`I will start sending reminders there from now on.`)
                )
                .addTextDisplayComponents(
                    text => text.setContent(`-# Unsubscribe anytime by using the \`/unsubscribe\` command.`)
                );

            await step3.update({
                content: null,
                components: [subscribedContainer],
            });

        } catch (e) {
            console.error(`[${tags.Error}] Failed to fetch or process schedule data during subscription flow.`);
            console.error(e);

            const errorContainer = new ContainerBuilder()
                .setAccentColor(Colors.DarkRed)
                .addSeparatorComponents(sep => sep)
                .addTextDisplayComponents(
                    text => text.setContent(`**Failed to process schedule data.** Please try again later or contact an admin.`)
                );

            await interaction.editReply({
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2],
            });
            return;
        }
    }
} as SlashCommandLayout;