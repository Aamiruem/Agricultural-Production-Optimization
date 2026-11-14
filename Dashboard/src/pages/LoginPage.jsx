import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { BrandMark } from "@/components/layout/Shell.jsx";
import { Button, Card, Segmented, TextField } from "@/components/ui/primitives.jsx";
import { useAuth } from "@/context/auth.js";

export default function LoginPage() {
  const { signIn, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next") : "/";
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") await signIn(form.email, form.password);
      else await register(form);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8">
      <BrandMark size={48} />
      <div className="text-center">
        <p className="text-2xl text-ink">{mode === "signin" ? "Sign in" : "Create your account"}</p>
        <p className="mt-1 text-sm text-ink-2">One account for the AI API, the farm service and this console.</p>
      </div>
      <Card className="w-full">
        <div className="mb-5 flex justify-center">
          <Segmented
            label="Account mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "signin", label: "Sign in" },
              { value: "register", label: "Register" },
            ]}
          />
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "register" && (
            <TextField
              label="Full name"
              autoComplete="name"
              required
              minLength={2}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          )}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : 1}
            maxLength={128}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {mode === "register" && (
            <p className="-mt-2 text-xs text-ink-3">At least 8 characters, mixing letters and numbers.</p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-[13px] text-bad">
              {error}
            </p>
          )}
          <Button type="submit" icon={mode === "signin" ? "login" : "add"} loading={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          {mode === "register" && (
            <p className="text-center text-xs text-ink-3">The first account on a fresh database becomes the admin.</p>
          )}
        </form>
      </Card>
    </div>
  );
}
