import { NextRequest } from "next/server";
import { slotUpdateEmitter } from "@/lib/events/slot-updates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            console.log("[SSE] Client connected");
            const onUpdate = () => {
                try {
                    console.log("[SSE] Sending update to client");
                    controller.enqueue(encoder.encode("data: update\n\n"));
                } catch (e) {
                    console.error("[SSE] Send error:", e);
                }
            };

            slotUpdateEmitter.on("update", onUpdate);
            console.log(`[SSE] Added listener, total listeners: ${slotUpdateEmitter.listenerCount("update")}`);

            // Initial ping
            console.log("[SSE] Sending initial ping");
            controller.enqueue(encoder.encode(": ping\n\n"));

            // Heartbeat every 30 seconds
            const interval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": ping\n\n"));
                } catch (_e) {
                    clearInterval(interval);
                    slotUpdateEmitter.off("update", onUpdate);
                }
            }, 30000);

            req.signal.addEventListener("abort", () => {
                console.log("[SSE] Client disconnected");
                clearInterval(interval);
                slotUpdateEmitter.off("update", onUpdate);
                console.log(`[SSE] Removed listener, total listeners: ${slotUpdateEmitter.listenerCount("update")}`);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
