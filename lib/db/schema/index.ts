import { pgTable, text, timestamp, boolean, uuid, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
    discordId: text("discord_id"),
    roles: text("roles").array(), // We'll store role IDs as an array of strings
});

export const userRelations = relations(user, ({ many }) => ({
    slots: many(slots),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const slots = pgTable("slots", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id), // Nullable for unassigned slots if we ever want pre-filled rows, but our plan says merge virtual slots. So normally only assigned slots are in DB.
    startTime: timestamp("start_time", { withTimezone: true }).notNull().unique(),
    durationMinutes: integer("duration_minutes").notNull(), // 60 or 120
    isBlocked: boolean("is_blocked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const slotsRelations = relations(slots, ({ one }) => ({
    user: one(user, {
        fields: [slots.userId],
        references: [user.id],
    }),
}));
