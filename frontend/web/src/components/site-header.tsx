"use client";

import { Moon, Sprout, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/context/theme-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/recommend", label: "Crop advisor" },
  { href: "/fertilizer", label: "Fertilizer" },
  { href: "/crops", label: "Crop library" },
  { href: "/planner", label: "Farm planner" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { mode, toggle } = useThemeMode();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0 sm:px-6">
        <Link href="/" className="mr-auto flex items-center gap-2 font-semibold sm:mr-0">
          <Sprout className="size-5 text-primary" aria-hidden />
          AgriOptima
        </Link>

        {/* On phones the nav drops to its own full-width row below the logo. */}
        <nav
          aria-label="Main"
          className="order-last -mx-2 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1"
        >
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

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
