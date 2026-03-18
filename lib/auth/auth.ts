import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

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
            scope: ["identify", "email", "guilds.members.read"], // Added scope to read guild members (for roles)
            mapUser: async (user: any, context: any) => {
                // Here we could fetch Discord roles from the API
                // if we had a Bot Token and Guild ID.
                // For now, we'll store the discordId.
                return {
                    ...user,
                    discordId: user.id,
                };
            }
        },
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user: any) => {
                    // Logic to fetch roles from Discord and update user.roles
                    // This is where we'd hit https://discord.com/api/guilds/{guild_id}/members/{user_id}
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
