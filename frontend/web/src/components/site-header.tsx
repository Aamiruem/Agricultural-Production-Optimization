"use client";

import { LogOut, Moon, Sprout, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { useThemeMode } from "@/context/theme-context";
import { cn } from "@/lib/utils";
import { useAuthStore, useSession } from "@/store/auth-store";

const NAV = [
  { href: "/recommend", label: "Crop advisor" },
  { href: "/fertilizer", label: "Fertilizer" },
  { href: "/crops", label: "Crops" },
  { href: "/planner", label: "Planner" },
  { href: "/farms", label: "Farms" },
  { href: "/assistant", label: "Assistant" },
  { href: "/insights", label: "Insights" },
];

function AccountMenu() {
  const { user, hydrated } = useSession();
  const logout = useAuthStore((s) => s.logout);
  if (!hydrated) return <span className="w-16" aria-hidden />;
  if (!user) {
    return (
      <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm", className: "px-3" })}>
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="hidden max-w-32 truncate text-sm text-muted-foreground lg:inline" title={user.email}>
        {user.full_name}
      </span>
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
        <LogOut />
      </Button>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { mode, toggle } = useThemeMode();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0 sm:px-6">
        <Link href="/" className="mr-auto flex items-center gap-2 font-semibold sm:mr-0">
          <Sprout className="size-5 text-primary" aria-hidden />
          AgriOptima
        </Link>

        {/* On phones the nav drops to its own full-width row below the logo. */}
        <nav
          aria-label="Main"
          className="order-last -mx-2 flex w-full items-center gap-0.5 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1"
        >
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <AccountMenu />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {mode === "dark" ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}
