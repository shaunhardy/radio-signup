import { addDays, startOfDay, addHours, isBefore } from "date-fns";
import { toZonedTime, formatInTimeZone, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/New_York";

export interface TimeSlotConfig {
    startTime: Date;
    durationMinutes: number;
}

export function generateRollingWeek(startDate: Date = new Date()): Date[] {
    const zonedStart = toZonedTime(startDate, TIMEZONE);
    const startOfZonedDay = startOfDay(zonedStart);
    
    return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(startOfZonedDay, i);
        return fromZonedTime(day, TIMEZONE);
    });
}

export function generateDailySlots(day: Date): TimeSlotConfig[] {
    const slots: TimeSlotConfig[] = [];
    
    const zonedDay = toZonedTime(day, TIMEZONE);
    let current = startOfDay(zonedDay);
    const end = addDays(current, 1);

    while (isBefore(current, end)) {
        const hour = current.getHours();
        
        // 12 AM to 2 AM (0:00 to 2:00) ET OR 4 PM to 12 AM (16:00 to 0:00 next day) ET
        // 0, 16, 18, 20, 22
        if (hour === 0 || hour >= 16) {
            slots.push({
                startTime: fromZonedTime(current, TIMEZONE),
                durationMinutes: 120,
            });
            current = addHours(current, 2);
        } else {
            // 2 AM to 4 PM (2:00 to 16:00) ET
            slots.push({
                startTime: fromZonedTime(current, TIMEZONE),
                durationMinutes: 60,
            });
            current = addHours(current, 1);
        }
    }

    return slots;
}

export function formatSlotTime(date: Date, duration: number): string {
    const end = new Date(date.getTime() + duration * 60000);
    const startStr = formatInTimeZone(date, TIMEZONE, "h:mm a");
    const endStr = formatInTimeZone(end, TIMEZONE, "h:mm a");
    return `${startStr} - ${endStr} ET`;
}
