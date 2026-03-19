import { EventEmitter } from "events";

class SlotUpdateEmitter extends EventEmitter {
    private constructor() {
        super();
        this.setMaxListeners(100);
    }

    public notifyUpdate() {
        const globalWithEmitter = global as typeof globalThis & {
            slotUpdateEmitter?: SlotUpdateEmitter;
        };
        const emitter = globalWithEmitter.slotUpdateEmitter || this;
        console.log(`[SlotUpdateEmitter] Notifying update, current listeners: ${emitter.listenerCount("update")}`);
        emitter.emit("update");
    }

    public static getInstance(): SlotUpdateEmitter {
        if (typeof window !== "undefined") {
            throw new Error("SlotUpdateEmitter should only be used on the server");
        }
        
        const globalWithEmitter = global as typeof globalThis & {
            slotUpdateEmitter?: SlotUpdateEmitter;
        };

        if (!globalWithEmitter.slotUpdateEmitter) {
            globalWithEmitter.slotUpdateEmitter = new SlotUpdateEmitter();
            console.log("[SlotUpdateEmitter] New instance created (global)");
        }
        return globalWithEmitter.slotUpdateEmitter;
    }
}

// Ensure we use the global instance during initialization
export const slotUpdateEmitter = SlotUpdateEmitter.getInstance();
