import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import {createAuthMiddleware} from "@better-auth/core/api";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    socialProviders: {
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            scope: ["identify", "email", "guilds.members.read"],
            mapUser: async (user, context) => {
                const guildId = process.env.DISCORD_GUILD_ID;

                if (guildId && context.accessToken) {
                    try {
                        const response = await fetch(
                            `https://discord.com/api/users/@me/guilds/${guildId}/member`,
                            {
                                headers: {
                                    Authorization: `Bearer ${context.accessToken}`,
                                },
                            }
                        );

                        if (response.ok) {
                            const member = await response.json();
                            return {
                                ...user,
                                discordId: user.id,
                                roles: member.roles,
                            };
                        }
                    } catch (e) {
                        console.error("Failed to fetch discord member info", e);
                    }
                }
                return {
                    ...user,
                    discordId: user.id,
                };
            }
        },
    },
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== '/callback/:id') return;

            const newSession = ctx.context.newSession;
            const userId = newSession?.user?.id;

            if (!userId) return;

            const account = await db.query.account.findFirst({
                where: eq(schema.account.userId, userId),
            });

            if (!account?.accessToken) return;

            const guildId = process.env.DISCORD_GUILD_ID;
            if (!guildId) return;

            try {
                const response = await fetch(
                    `https://discord.com/api/users/@me/guilds/${guildId}/member`,
                    {
                        headers: {
                            Authorization: `Bearer ${account.accessToken}`,
                        },
                    }
                );

                if (response.ok) {
                    const member = await response.json();
                    const roles = member.roles;

                    console.log("ROLES", roles);

                    await db.update(schema.user)
                        .set({ roles })
                        .where(eq(schema.user.id, userId));

                    if (newSession.user) {
                        newSession.user.roles = roles;
                    }
                }
            } catch (e) {
                console.error("Failed to update user roles in after hook", e);
            }
        }),
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // This is still here if needed for future tasks,
                    // but roles are handled in mapUser during sign in.
                }
            }
        }
    },
    user: {
        additionalFields: {
            discordId: {
                type: "string",
                required: false,
            },
            roles: {
                type: "string[]",
                required: false,
            }
        }
    }
});
