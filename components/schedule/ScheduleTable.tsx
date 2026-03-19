"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateRollingWeek } from "@/lib/utils/schedule";
import { DayColumn } from "./DayColumn";
import { startOfDay, addDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function ScheduleTable() {
    const days = generateRollingWeek();
    const start = days[0];
    const end = addDays(start, 7);

    const queryClient = useQueryClient();

    const { data: slots, isLoading, error } = useQuery({
        queryKey: ["slots", start.toISOString()],
        queryFn: async () => {
            const res = await fetch(`/api/slots?start=${start.toISOString()}&end=${end.toISOString()}`);
            if (!res.ok) throw new Error("Failed to fetch slots");
            return res.json();
        },
    });

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let retryCount = 0;
        const maxRetries = 5;

        const connect = () => {
            if (eventSource) eventSource.close();
            
            console.log("[ScheduleTable] Connecting to SSE...");
            eventSource = new EventSource("/api/slots/updates");
            
            eventSource.onopen = () => {
                console.log("[ScheduleTable] SSE Connected");
                retryCount = 0;
            };

            eventSource.onmessage = (event) => {
                console.log("[ScheduleTable] Received SSE message:", event.data);
                if (event.data === "update") {
                    console.log("[ScheduleTable] Invalidating slots query");
                    queryClient.invalidateQueries({ queryKey: ["slots"] });
                }
            };

            eventSource.onerror = (error) => {
                console.error("[ScheduleTable] EventSource error:", error);
                eventSource?.close();
                
                if (retryCount < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                    console.log(`[ScheduleTable] Retrying SSE connection in ${delay}ms...`);
                    setTimeout(connect, delay);
                    retryCount++;
                } else {
                    console.error("[ScheduleTable] Max SSE retries reached.");
                }
            };
        };

        connect();

        return () => {
            if (eventSource) {
                console.log("[ScheduleTable] Closing SSE connection");
                eventSource.close();
            }
        };
    }, [queryClient]);

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
