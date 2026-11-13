import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="py-8">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
