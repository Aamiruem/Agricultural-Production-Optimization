import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="py-8">
      {/* useSearchParams() inside needs a Suspense boundary for the static shell */}
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
