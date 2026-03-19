import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { slots } from "../../../../lib/db/schema";
import { auth } from "../../../../lib/auth/auth";
import { eq } from "drizzle-orm";
import { DISCORD_ROLES } from "../../../../lib/constants";
import { slotUpdateEmitter } from "@/lib/events/slot-updates";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: slotId } = await params;

    try {
        const slot = await db.query.slots.findFirst({
            where: eq(slots.id, slotId)
        });

        if (!slot) {
            return NextResponse.json({ error: "Slot not found" }, { status: 404 });
        }

        // Check ownership or admin status
        const isOwner = slot.userId === session.user.id;
        const isAdmin = session.user.roles?.includes(DISCORD_ROLES.ADMIN);
        const hasAllowedRole = session.user.roles?.includes(DISCORD_ROLES.ALLOWED);

        // Owners can only unassign if they still have the allowed role (or are admin)
        // This is a safety check: if their role was revoked, they shouldn't be able to manage their slots.
        if (isOwner) {
            if (!hasAllowedRole && !isAdmin) {
                return NextResponse.json({ error: "Forbidden: You no longer have the required role to manage slots" }, { status: 403 });
            }
        } else if (!isAdmin) {
            // Not the owner and not an admin
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.delete(slots).where(eq(slots.id, slotId));

        slotUpdateEmitter.notifyUpdate();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to release slot:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
