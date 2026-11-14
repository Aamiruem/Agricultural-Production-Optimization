import "@/styles/public.scss";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, LogOut, Palette, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/components/common/PageHeader";
import { clearLastAnalysis, loadLastAnalysis } from "@/features/local/lastAnalysis";
import { useSignOut } from "@/hooks/useSignOut";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/i18n/useT";
import { getErrorMessage } from "@/services/apiClient";
import { changePassword, updateProfile } from "@/services/authService";
import { useAuthStore, useSession } from "@/store/authStore";
import { G } from "@/lib/icons";
import { changePasswordSchema } from "@/utils/validation";

function Alert({ mutation, ok }) {
  if (mutation.isSuccess)
    return (
      <div className="form-alert form-alert--ok" role="status">
        <CheckCircle2 size={18} aria-hidden="true" /> {ok}
      </div>
    );
  if (mutation.isError)
    return (
      <div className="form-alert form-alert--error" role="alert">
        {getErrorMessage(mutation.error)}
      </div>
    );
  return null;
}

function ProfileCard() {
  const { user } = useSession();
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState(user?.full_name ?? "");
  const [err, setErr] = useState(null);
  const save = useMutation({
    mutationFn: () => updateProfile(name.trim()),
    onSuccess: (u) => {
      // Keep the token and expiry, refresh only the user record.
      const s = useAuthStore.getState();
      setSession({ access_token: s.token, user: u, expires_in: (s.expiresAt - Date.now()) / 1000 });
    },
  });
  return (
    <section className="g-card settings-card" aria-labelledby="set-profile">
      <h2 id="set-profile">
        <UserRound size={20} aria-hidden="true" /> Profile
      </h2>
      <form
        className="auth-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length < 2) return setErr("Enter at least 2 characters.");
          setErr(null);
          save.mutate();
        }}
      >
        <div className="field-x">
          <label htmlFor="set-name">Full name</label>
          <input
            id="set-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(err)}
          />
          {err && (
            <span className="field-err" role="alert">
              {err}
            </span>
          )}
        </div>
        <div className="field-x">
          <label htmlFor="set-email">Email</label>
          <input id="set-email" value={user?.email ?? ""} readOnly disabled />
          <span className="field-hint">
            Role: {user?.role ?? "user"}
            {user?.created_at ? ` · member since ${new Date(user.created_at).toLocaleDateString("en-IN")}` : ""}
          </span>
        </div>
        <Alert mutation={save} ok="Profile saved." />
        <button type="submit" className="btn-x btn-x--primary" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}

function PasswordCard() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });
  const save = useMutation({
    mutationFn: (v) => changePassword(v.current_password, v.new_password),
    onSuccess: () => reset(),
  });
  const field = (name, label, autoComplete) => (
    <div className="field-x">
      <label htmlFor={`pw-${name}`}>{label}</label>
      <input
        id={`pw-${name}`}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={Boolean(errors[name])}
        {...register(name)}
      />
      {errors[name] && (
        <span className="field-err" role="alert">
          {errors[name].message}
        </span>
      )}
    </div>
  );
  return (
    <section className="g-card settings-card" aria-labelledby="set-password">
      <h2 id="set-password">
        <KeyRound size={20} aria-hidden="true" /> Change password
      </h2>
      <form className="auth-form" noValidate onSubmit={handleSubmit((v) => save.mutate(v))}>
        {field("current_password", "Current password", "current-password")}
        {field("new_password", "New password", "new-password")}
        {field("confirm", "Confirm new password", "new-password")}
        <Alert mutation={save} ok="Password changed. Use the new password next time you sign in." />
        <button type="submit" className="btn-x btn-x--primary" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Change password"}
        </button>
      </form>
    </section>
  );
}

function PreferencesCard() {
  const { mode, setMode } = useTheme();
  const { lang, setLang } = useT();
  const [hasAnalysis, setHasAnalysis] = useState(() => Boolean(loadLastAnalysis()));
  return (
    <section className="g-card settings-card" aria-labelledby="set-prefs">
      <h2 id="set-prefs">
        <Palette size={20} aria-hidden="true" /> Preferences
      </h2>
      <div className="auth-form">
        <div className="field-x">
          <label htmlFor="set-theme">Theme</label>
          <select id="set-theme" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="field-x">
          <label htmlFor="set-lang">Dashboard language</label>
          <select id="set-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
          <span className="field-hint">Menus and tool labels; the public website is in English.</span>
        </div>
        <div className="field-x">
          <span className="field-label">Saved analysis</span>
          {hasAnalysis ? (
            <button
              type="button"
              className="btn-x btn-x--secondary"
              onClick={() => {
                clearLastAnalysis();
                setHasAnalysis(false);
              }}
            >
              <Trash2 size={16} aria-hidden="true" /> Clear latest analysis from this browser
            </button>
          ) : (
            <span className="field-hint">No analysis summary is stored in this browser.</span>
          )}
        </div>
      </div>
    </section>
  );
}

/** Account settings: profile, password, preferences and sign out. */
export default function SettingsPage() {
  const signOut = useSignOut();
  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        description="Manage your AgriSmart account and preferences."
        icon={UserRound}
        color={G.green}
      />
      <div className="settings-grid">
        <ProfileCard />
        <PasswordCard />
        <PreferencesCard />
        <section className="g-card settings-card" aria-labelledby="set-session">
          <h2 id="set-session">
            <LogOut size={20} aria-hidden="true" /> Session
          </h2>
          <p className="field-hint">
            Sign out removes your session from this browser. Sessions also end automatically when the access token
            expires.
          </p>
          <button type="button" className="btn-x btn-x--secondary" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
