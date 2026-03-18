import { addDays, startOfDay, addHours, isAfter, isBefore, isEqual, format } from "date-fns";

export interface TimeSlotConfig {
    startTime: Date;
    durationMinutes: number;
}

export function generateRollingWeek(startDate: Date = new Date()): Date[] {
    const start = startOfDay(startDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function generateDailySlots(day: Date): TimeSlotConfig[] {
    const slots: TimeSlotConfig[] = [];
    let current = startOfDay(day);
    const end = addDays(current, 1);

    while (isBefore(current, end)) {
        const hour = current.getHours();
        
        // 4 PM to 12 AM (16:00 to 00:00 next day)
        // 16, 18, 20, 22
        if (hour >= 16) {
            slots.push({
                startTime: new Date(current),
                durationMinutes: 120,
            });
            current = addHours(current, 2);
        } else {
            // 12 AM to 4 PM (00:00 to 16:00)
            slots.push({
                startTime: new Date(current),
                durationMinutes: 60,
            });
            current = addHours(current, 1);
        }
    }

    return slots;
}

export function formatSlotTime(date: Date, duration: number): string {
    const end = new Date(date.getTime() + duration * 60000);
    return `${format(date, "h:mm a")} - ${format(end, "h:mm a")}`;
}
