"use client";

import { generateDailySlots } from "@/lib/utils/schedule";
import { TimeSlot } from "./TimeSlot";
import { format } from "date-fns";

interface Slot {
    id: string;
    userId: string | null;
    startTime: string;
    durationMinutes: number;
}

interface DayColumnProps {
    day: Date;
    assignedSlots: Slot[];
}

export function DayColumn({ day, assignedSlots }: DayColumnProps) {
    const dailySlotConfigs = generateDailySlots(day);

    return (
        <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="text-center font-bold border-b pb-2 mb-2 sticky top-0 bg-white">
                <div>{format(day, "EEEE")}</div>
                <div className="text-sm text-gray-500">{format(day, "MMM do")}</div>
            </div>
            <div className="flex flex-col gap-2">
                {dailySlotConfigs.map((config) => {
                    const assigned = assignedSlots.find(
                        (s) => new Date(s.startTime).getTime() === config.startTime.getTime()
                    );
                    return (
                        <TimeSlot
                            key={config.startTime.toISOString()}
                            startTime={config.startTime}
                            durationMinutes={config.durationMinutes}
                            assignedSlot={assigned}
                        />
                    );
                })}
            </div>
        </div>
    );
}
