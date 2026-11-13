"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/client";
import { login, register } from "@/lib/api/endpoints";
import { loginSchema, registerSchema, type RegisterFormValues } from "@/lib/validation";
import { useAuthStore } from "@/store/auth-store";

type Mode = "login" | "register";

/** Only allow same-site relative redirects (prevents open-redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/farms";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const isRegister = mode === "register";

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    // login only validates email + password; full_name is ignored there
    resolver: zodResolver((isRegister ? registerSchema : loginSchema) as typeof registerSchema),
  });

  const mutation = useMutation({
    mutationFn: (v: RegisterFormValues) => (isRegister ? register(v) : login(v.email, v.password)),
    onSuccess: (res) => {
      setSession(res);
      router.push(safeNext(params.get("next")));
    },
  });

  const fields: { name: keyof RegisterFormValues; label: string; type: string; autoComplete: string }[] = [
    ...(isRegister ? [{ name: "full_name" as const, label: "Full name", type: "text", autoComplete: "name" }] : []),
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    {
      name: "password", label: "Password", type: "password",
      autoComplete: isRegister ? "new-password" : "current-password",
    },
  ];

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{isRegister ? "Create your account" : "Sign in"}</CardTitle>
        <CardDescription>
          {isRegister
            ? "Save recommendation history, manage farms and run batch jobs."
            : "Welcome back. Sign in to your farms and history."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate aria-label={isRegister ? "Register" : "Sign in"} onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4">
          {fields.map((f) => (
            <div key={f.name} className="grid gap-1.5">
              <Label htmlFor={`auth-${f.name}`}>{f.label}</Label>
              <Input
                id={`auth-${f.name}`}
                type={f.type}
                autoComplete={f.autoComplete}
                aria-invalid={errors[f.name] ? true : undefined}
                {...field(f.name)}
              />
              {errors[f.name] && (
                <p role="alert" className="text-xs text-destructive">
                  {errors[f.name]?.message}
                </p>
              )}
            </div>
          ))}
          {mutation.isError && (
            <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {getErrorMessage(mutation.error)}
            </p>
          )}
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />}
            {isRegister ? "Create account" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account? " : "New here? "}
            <Link href={isRegister ? "/login" : "/register"} className="text-primary hover:underline">
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
