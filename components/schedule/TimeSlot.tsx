"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/auth-client";
import { formatSlotTime } from "@/lib/utils/schedule";
import { cn } from "@/lib/utils"; // Assuming a standard cn utility exists or I'll create one
import { Loader2 } from "lucide-react";

interface Slot {
    id: string;
    userId: string | null;
    startTime: string;
    durationMinutes: number;
}

interface TimeSlotProps {
    startTime: Date;
    durationMinutes: number;
    assignedSlot?: Slot;
}

export function TimeSlot({ startTime, durationMinutes, assignedSlot }: TimeSlotProps) {
    const { data: session } = authClient.useSession();
    const queryClient = useQueryClient();

    const claimMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/slots", {
                method: "POST",
                body: JSON.stringify({ startTime, durationMinutes }),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to claim");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slots"] });
        },
    });

    const releaseMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/slots/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to release");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slots"] });
        },
    });

    const isOccupied = !!assignedSlot;
    const isMine = assignedSlot?.userId === session?.user?.id;
    const isAdmin = session?.user?.roles?.includes("admin");

    const handleClick = () => {
        if (!session) return alert("Please login first");
        if (isMine || (isOccupied && isAdmin)) {
            if (confirm("Are you sure you want to release this slot?")) {
                releaseMutation.mutate(assignedSlot!.id);
            }
        } else if (!isOccupied) {
            claimMutation.mutate();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
                p-2 border rounded cursor-pointer transition-colors text-sm
                ${!isOccupied ? "bg-green-50 hover:bg-green-100 border-green-200" : ""}
                ${isMine ? "bg-blue-500 text-white border-blue-600" : ""}
                ${isOccupied && !isMine ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed" : ""}
                ${isOccupied && isAdmin && !isMine ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer" : ""}
            `}
        >
            <div className="font-semibold">{formatSlotTime(startTime, durationMinutes)}</div>
            <div className="text-xs">
                {isMine ? "Claimed by You" : isOccupied ? "Occupied" : "Available"}
                {(claimMutation.isPending || releaseMutation.isPending) && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
            </div>
        </div>
    );
}
