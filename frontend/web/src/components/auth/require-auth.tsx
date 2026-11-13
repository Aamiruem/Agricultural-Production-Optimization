"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/store/auth-store";

/** Renders children only for signed-in users; otherwise a sign-in prompt. */
export function RequireAuth({ children, what }: { children: React.ReactNode; what: string }) {
  const { user, hydrated } = useSession();
  const pathname = usePathname();

  if (!hydrated) return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  if (user) return <>{children}</>;
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <Lock className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-muted-foreground">Sign in to {what}.</p>
      <div className="flex gap-2">
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonVariants({ className: "px-4" })}>
          Sign in
        </Link>
        <Link href="/register" className={buttonVariants({ variant: "outline", className: "px-4" })}>
          Create account
        </Link>
      </div>
    </div>
  );
}
