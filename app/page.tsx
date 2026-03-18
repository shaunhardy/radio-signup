"use client";

import { authClient } from "@/lib/auth/auth-client";
import { ScheduleTable } from "@/components/schedule/ScheduleTable";
import { LogIn, LogOut, User } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold tracking-tight">Radio Signup</div>
          
          <div className="flex items-center gap-4">
            {isPending ? (
              <div className="h-8 w-24 animate-pulse rounded bg-zinc-100" />
            ) : session ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name} 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="hidden sm:inline">{session.user.name}</span>
                </div>
                <button
                  onClick={() => authClient.signOut()}
                  className="flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => authClient.signIn.social({ provider: "discord" })}
                className="flex items-center gap-2 rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
              >
                <LogIn className="h-4 w-4" />
                Login with Discord
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="px-4 mb-8">
          <h1 className="text-3xl font-bold mb-2">Weekly Schedule</h1>
          <p className="text-zinc-600">Select an available slot to assign yourself. 4PM - 12AM slots are 2-hour blocks.</p>
        </div>

        <ScheduleTable />
      </main>
    </div>
  );
}
