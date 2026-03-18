"use client";

import { useQuery } from "@tanstack/react-query";
import { generateRollingWeek } from "@/lib/utils/schedule";
import { DayColumn } from "./DayColumn";
import { startOfDay, addDays } from "date-fns";
import { Loader2 } from "lucide-react";

export function ScheduleTable() {
    const days = generateRollingWeek();
    const start = days[0];
    const end = addDays(start, 7);

    const { data: slots, isLoading, error } = useQuery({
        queryKey: ["slots", start.toISOString()],
        queryFn: async () => {
            const res = await fetch(`/api/slots?start=${start.toISOString()}&end=${end.toISOString()}`);
            if (!res.ok) throw new Error("Failed to fetch slots");
            return res.json();
        },
    });

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin" /></div>;
    if (error) return <div className="text-red-500 p-10 text-center">Error loading schedule: {error.message}</div>;

    return (
        <div className="flex overflow-x-auto gap-4 p-4 pb-10">
            {days.map((day) => (
                <DayColumn 
                    key={day.toISOString()} 
                    day={day} 
                    assignedSlots={slots || []} 
                />
            ))}
        </div>
    );
}
