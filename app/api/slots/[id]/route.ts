import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { slots } from "../../../../lib/db/schema";
import { auth } from "../../../../lib/auth/auth";
import { eq } from "drizzle-orm";

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
        // (Assuming session.user.roles contains "admin" if they are admin)
        const isAdmin = session.user.roles?.includes("admin");
        if (slot.userId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.delete(slots).where(eq(slots.id, slotId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to release slot:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
