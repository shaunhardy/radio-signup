import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { slots } from "../../../lib/db/schema";
import { auth } from "../../../lib/auth/auth";
import { and, gte, lte } from "drizzle-orm";
import { DISCORD_ROLES } from "../../../lib/constants";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!startParam || !endParam) {
        return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }

    try {
        const start = new Date(startParam);
        const end = new Date(endParam);

        const assignedSlots = await db.query.slots.findMany({
            where: and(
                gte(slots.startTime, start),
                lte(slots.startTime, end)
            ),
            with: {
                user: {
                    columns: {
                        name: true,
                    }
                },
            }
        });

        return NextResponse.json(assignedSlots);
    } catch (error) {
        console.error("Failed to fetch slots:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAllowedRole = session.user.roles?.includes(DISCORD_ROLES.ALLOWED);
    const isAdmin = session.user.roles?.includes(DISCORD_ROLES.ADMIN);

    if (!hasAllowedRole && !isAdmin) {
        return NextResponse.json({ error: "Forbidden: You do not have the required role to claim a slot" }, { status: 403 });
    }

    const { startTime, durationMinutes } = await req.json();

    if (!startTime || !durationMinutes) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        const start = new Date(startTime);

        // Check if already claimed (Unique constraint in DB will also handle this but checking explicitly is better for error message)
        const existing = await db.query.slots.findFirst({
            where: gte(slots.startTime, start), // This is a bit naive, should be exact start_time check
        });

        // The query above is simplified. For a robust check:
        const exactMatch = await db.query.slots.findFirst({
            where: and(
                gte(slots.startTime, start),
                lte(slots.startTime, start)
            )
        });

        if (exactMatch) {
            return NextResponse.json({ error: "Slot already claimed" }, { status: 409 });
        }

        const [newSlot] = await db.insert(slots).values({
            userId: session.user.id,
            startTime: start,
            durationMinutes,
        }).returning();

        return NextResponse.json(newSlot);
    } catch (error) {
        console.error("Failed to claim slot:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
