import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getErrorMessage, isApiUnavailable } from "@/services/apiClient";
import { forgotPassword, login, register as registerUser, resetPassword } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { safeRedirect } from "@/utils/format";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "@/utils/validation";

const COPY = {
  login: { title: "Welcome back", lead: "Sign in to your AgriSmart dashboard.", submit: "Login", schema: loginSchema },
  register: {
    title: "Create your account",
    lead: "Free forever. Save farms, analyses and history.",
    submit: "Create account",
    schema: registerSchema,
  },
  forgot: {
    title: "Forgot your password?",
    lead: "Enter your email and we will send you a reset link.",
    submit: "Send reset link",
    schema: forgotSchema,
  },
  reset: {
    title: "Choose a new password",
    lead: "Use at least 8 characters with letters and numbers.",
    submit: "Save new password",
    schema: resetSchema,
  },
};

const FIELDS = {
  login: [
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
  ],
  register: [
    { name: "full_name", label: "Full name", type: "text", autoComplete: "name" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    {
      name: "password",
      label: "Password",
      type: "password",
      autoComplete: "new-password",
      hint: "At least 8 characters, letters and numbers.",
    },
  ],
  forgot: [{ name: "email", label: "Email", type: "email", autoComplete: "email" }],
  reset: [
    { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
    { name: "confirm", label: "Confirm new password", type: "password", autoComplete: "new-password" },
  ],
};

function friendlyError(error) {
  if (!error) return null;
  if (error.code === "API_HTML" || isApiUnavailable(error))
    return "The AgriSmart account service is not reachable. Accounts need the AgriSmart API — please try again later.";
  return getErrorMessage(error);
}

/** Login, registration, forgot-password and reset forms (one component, four modes). */
export function AuthForm({ mode }) {
  const copy = COPY[mode];
  useDocumentTitle(copy.title, null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(copy.schema) });

  const mutation = useMutation({
    mutationFn: async (v) => {
      let res;
      if (mode === "login") res = await login(v.email, v.password);
      else if (mode === "register") res = await registerUser(v);
      else if (mode === "forgot") res = await forgotPassword(v.email);
      else res = await resetPassword(params.get("token") ?? "", v.password);
      if (typeof res === "string") throw Object.assign(new Error("no api"), { code: "API_HTML" });
      return res;
    },
    onSuccess: (res) => {
      if (mode === "login" || mode === "register") {
        setSession(res); // JWT kept in the persisted session store and sent by the API client
        navigate(safeRedirect(params.get("next")), { replace: true });
      } else setDone(res ?? {});
    },
  });

  const next = params.get("next");
  const carry = next ? `?next=${encodeURIComponent(next)}` : "";

  if (mode === "reset" && !params.get("token")) {
    return (
      <div className="auth-box">
        <h1>Reset link missing</h1>
        <p className="auth-lead">Open the link from your email, or request a new one.</p>
        <Link to="/forgot-password" className="btn-x btn-x--primary">
          Request a reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-box">
        <h1>{mode === "forgot" ? "Check your email" : "Password updated"}</h1>
        {mode === "forgot" ? (
          <>
            <div className="form-alert form-alert--ok" role="status">
              {done.detail}
            </div>
            {done.dev_reset_url && (
              <div className="form-alert form-alert--info" role="note">
                Development only — no email server is configured, so here is the reset link:{" "}
                <a href={done.dev_reset_url}>{done.dev_reset_url}</a>
              </div>
            )}
          </>
        ) : (
          <div className="form-alert form-alert--ok" role="status">
            Your password has been changed. Sign in with the new password.
          </div>
        )}
        <Link to="/login" className="btn-x btn-x--primary">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <div>
        <h1>{copy.title}</h1>
        <p className="auth-lead">{copy.lead}</p>
      </div>
      <form noValidate aria-label={copy.title} className="auth-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        {FIELDS[mode].map((f) => {
          const isPw = f.type === "password";
          return (
            <div key={f.name} className="field-x">
              <label htmlFor={`auth-${f.name}`}>{f.label}</label>
              <div style={{ position: "relative" }}>
                <input
                  id={`auth-${f.name}`}
                  type={isPw && show ? "text" : f.type}
                  autoComplete={f.autoComplete}
                  aria-invalid={Boolean(errors[f.name])}
                  aria-describedby={errors[f.name] ? `auth-${f.name}-err` : f.hint ? `auth-${f.name}-hint` : undefined}
                  style={isPw ? { paddingRight: "3rem" } : undefined}
                  {...register(f.name)}
                />
                {isPw && (
                  <button
                    type="button"
                    className="pub-icon-btn"
                    style={{ position: "absolute", right: 4, top: 4 }}
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
              {errors[f.name] ? (
                <span id={`auth-${f.name}-err`} className="field-err" role="alert">
                  {errors[f.name].message}
                </span>
              ) : (
                f.hint && (
                  <span id={`auth-${f.name}-hint`} className="field-hint">
                    {f.hint}
                  </span>
                )
              )}
            </div>
          );
        })}
        {mode === "login" && (
          <div className="auth-row">
            <span />
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        )}
        {mutation.error && (
          <div className="form-alert form-alert--error" role="alert">
            {friendlyError(mutation.error)}
          </div>
        )}
        <button type="submit" className="btn-x btn-x--primary" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 size={18} className="spin-x" aria-hidden="true" />} {copy.submit}
        </button>
      </form>
      {mode === "login" && (
        <p className="auth-alt">
          New to AgriSmart? <Link to={`/register${carry}`}>Create an account</Link>
        </p>
      )}
      {mode === "register" && (
        <p className="auth-alt">
          Already have an account? <Link to={`/login${carry}`}>Login</Link>
          <br />
          By creating an account you agree to the <Link to="/terms">Terms</Link> and{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      )}
      {(mode === "forgot" || mode === "reset") && (
        <p className="auth-alt">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      )}
    </div>
  );
}
