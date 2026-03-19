"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/auth-client";
import { formatSlotTime } from "@/lib/utils/schedule";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { DISCORD_ROLES } from "@/lib/constants";

interface Slot {
    id: string;
    userId: string | null;
    startTime: string;
    durationMinutes: number;
    user?: {
        name: string;
    } | null;
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
    const isMine = assignedSlot?.userId && assignedSlot?.userId === session?.user?.id;
    const isAdmin = session?.user?.roles?.includes(DISCORD_ROLES.ADMIN);
    const hasAllowedRole = session?.user?.roles?.includes(DISCORD_ROLES.ALLOWED);

    const canClaim = !isOccupied && (hasAllowedRole || isAdmin);
    const canRelease = (isMine && (hasAllowedRole || isAdmin)) || (isOccupied && isAdmin);

    const handleClick = () => {
        if (!session) return alert("Please login first");
        if (isMine || (isOccupied && isAdmin)) {
            if (!canRelease) return alert("You do not have permission to release this slot");
            if (confirm("Are you sure you want to release this slot?")) {
                releaseMutation.mutate(assignedSlot!.id);
            }
        } else if (!isOccupied) {
            if (!canClaim) return alert("You do not have the required role to claim a slot");
            claimMutation.mutate();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "p-2 border rounded cursor-pointer transition-colors text-sm",
                !isOccupied && (hasAllowedRole || isAdmin) && "bg-green-50 hover:bg-green-100 border-green-200",
                !isOccupied && !hasAllowedRole && !isAdmin && "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed",
                isMine && "bg-blue-500 text-white border-blue-600",
                isOccupied && !isMine && !isAdmin && "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed",
                isOccupied && isAdmin && !isMine && "bg-red-50 text-red-700 border-red-100 hover:bg-red-100 hover:border-red-200"
            )}
        >
            <div className="font-semibold">{formatSlotTime(startTime, durationMinutes)}</div>
            <div className="text-xs">
                {isMine ? "Claimed by You" : isOccupied ? (assignedSlot?.user?.name || "Occupied") : "Available"}
                {(claimMutation.isPending || releaseMutation.isPending) && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
            </div>
        </div>
    );
}
