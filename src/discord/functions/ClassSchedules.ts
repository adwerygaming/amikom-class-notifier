import { Colors, ContainerBuilder } from "discord.js";
import moment from "moment-timezone";
import { Helper } from "../../amikom/Helper.js";
import { ClassSchedule, ListHari } from "../../types/Amikom.types.js";

const helper = new Helper();
const dayOrder: ListHari[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];
const dayToIso: Record<ListHari, number> = {
	SENIN: 1,
	SELASA: 2,
	RABU: 3,
	KAMIS: 4,
	JUMAT: 5,
};

export interface BuildScheduleContainersOptions {
	schedule: ClassSchedule[]
	now?: moment.Moment
	onlyDay?: ListHari
	perDayLimit?: number
	emptyDayMessage?: string
}

export function buildScheduleContainers(options: BuildScheduleContainersOptions): { containers: ContainerBuilder[]; hasAnyClasses: boolean } {
	const now = options.now ?? moment().tz("Asia/Jakarta").locale("id");
	const perDayLimit = options.perDayLimit ?? 5;
	const onlyDay = options.onlyDay;

	const containers: ContainerBuilder[] = [];
	let hasAnyClasses = false;

	for (const day of dayOrder) {
		if (onlyDay && day !== onlyDay) continue;

		const items = options.schedule.filter(s => s.Hari === day);
		const baseDay = now.clone().isoWeekday(dayToIso[day]);
		const dayDate = baseDay.format("DD MMMM YYYY");
		const isToday = now.isoWeekday() === dayToIso[day];

		if (!items.length) {
			if (onlyDay) {
				const emptyContainer = new ContainerBuilder()
					.setAccentColor(Colors.Orange)
					.addTextDisplayComponents(text => text.setContent(`**${day}** - ${dayDate}`))
					.addSeparatorComponents(sep => sep)
					.addTextDisplayComponents(text => text.setContent(options.emptyDayMessage ?? "No classes scheduled."));

				containers.push(emptyContainer);
			}
			continue;
		}

		hasAnyClasses = true;

        const cb = new ContainerBuilder()
            .setAccentColor(isToday ? Colors.Orange : Colors.DarkPurple)
            .addTextDisplayComponents(text => text.setContent(`**${day}** - ${dayDate}`));

        const limited = items.slice(0, perDayLimit);
        let nextName: string | null = null;
        let nextStart: moment.Moment | null = null;
        const classDisplays: string[] = [];

        for (const s of limited) {
            const { start: startTime, end: endTime } = helper.resolveClassTime(now, s.Waktu);
            const time = `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`;
            const duration = helper.formatDuration(endTime.diff(startTime, "minutes"));

            const classStart = baseDay.clone().set({
                hour: startTime.hour(),
                minute: startTime.minute(),
                second: 0,
                millisecond: 0,
            });

            if (isToday && classStart.isAfter(now) && (!nextStart || classStart.isBefore(nextStart))) {
                nextStart = classStart;
                nextName = s.MataKuliah;
            }

            classDisplays.push(`> **${s.MataKuliah}**\n> 👤 _${s.NamaDosen}_\n> ⏱️ **${time}** (${duration})\n> 🚪 _${s.Ruang}_`);
        }

        if (isToday && nextStart && nextName) {
            const countdown = `<t:${nextStart.unix()}:R>`;
            cb.addTextDisplayComponents(text => text.setContent(`**Next: ${nextName} ${countdown}**`));
        }

        cb.addSeparatorComponents(sep => sep);

		for (const display of classDisplays) {
			cb.addTextDisplayComponents(text => text.setContent(display));
		}

		if (items.length > perDayLimit) {
			cb.addTextDisplayComponents(text => text.setContent(`…and ${items.length - perDayLimit} more`));
		}

		containers.push(cb);
	}

	return { containers, hasAnyClasses };
}

export interface BuildTodayContainersOptions {
	schedule: ClassSchedule[]
	now?: moment.Moment
}

export function buildTodayContainers(options: BuildTodayContainersOptions): { containers: ContainerBuilder[]; todayKey: ListHari | null } {
	const now = options.now ?? moment().tz("Asia/Jakarta").locale("id");
	const isoDay = now.isoWeekday();
	const isoToDay: Record<number, ListHari> = {
		1: "SENIN",
		2: "SELASA",
		3: "RABU",
		4: "KAMIS",
		5: "JUMAT",
	};

	const todayKey = isoToDay[isoDay] ?? null;

	if (!todayKey) {
		const fallbackTodayKey = now.format("dddd").toUpperCase();
		const todayDateFormatted = now.format("DD MMMM YYYY");
		const container = new ContainerBuilder()
			.setAccentColor(Colors.Orange)
			.addTextDisplayComponents(text => text.setContent(`**${fallbackTodayKey}** - ${todayDateFormatted}`))
			.addSeparatorComponents(sep => sep)
			.addTextDisplayComponents(text => text.setContent("You have no classes today."));

		return { containers: [container], todayKey };
	}

	const { containers } = buildScheduleContainers({
		schedule: options.schedule,
		now,
		onlyDay: todayKey,
		emptyDayMessage: "You have no classes today.",
	});

	return { containers, todayKey };
}
