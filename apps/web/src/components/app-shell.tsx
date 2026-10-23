"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ChartNoAxesColumn,
  Columns3,
  List,
  ListChecks,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { showError } from "@/lib/tasks";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

const navigation = [
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/list", label: "List", icon: List },
  { href: "/sections", label: "Sections", icon: ListChecks },
  { href: "/insights", label: "Insights", icon: ChartNoAxesColumn },
  { href: "/archived", label: "Archived", icon: Archive },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useMe();

  async function logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
      queryClient.clear();
      router.replace("/login");
    } catch (error) {
      showError(error);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-100",
                      active
                        ? "bg-accent-tint font-medium text-accent-tint-text"
                        : "text-muted hover:bg-accent-tint hover:text-accent-tint-text",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 rounded-md px-2 py-1.5">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium text-muted"
            >
              {user?.name.slice(0, 1).toUpperCase() ?? "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-5">{user?.name}</span>
              <span className="block truncate text-xs leading-4 text-muted">
                {user?.email}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void logout()}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void logout()}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="md:pl-60">
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-border bg-surface md:hidden"
      >
        {navigation.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs",
                active ? "text-accent-tint-text" : "text-muted",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
