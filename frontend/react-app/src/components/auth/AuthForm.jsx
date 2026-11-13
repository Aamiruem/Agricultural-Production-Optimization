import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { Link, useNavigate, useSearchParams } from "react-router";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { login, register as registerUser } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { safeRedirect } from "@/utils/format";
import { loginSchema, registerSchema } from "@/utils/validation";

export function AuthForm({ mode }) {
  const isRegister = mode === "register";
  useDocumentTitle(isRegister ? "Create account" : "Sign in");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(isRegister ? registerSchema : loginSchema) });

  const mutation = useMutation({
    mutationFn: (v) => (isRegister ? registerUser(v) : login(v.email, v.password)),
    onSuccess: (res) => {
      setSession(res); // JWT stored (Zustand + localStorage), sent by the Axios interceptor
      navigate(safeRedirect(params.get("next")), { replace: true });
    },
  });

  const fields = [
    ...(isRegister ? [{ name: "full_name", label: "Full name", type: "text", autoComplete: "name" }] : []),
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "password", label: "Password", type: "password", autoComplete: isRegister ? "new-password" : "current-password" },
  ];

  return (
    <Card>
      <Card.Body className="p-4">
        <h1 className="h4">{isRegister ? "Create your account" : "Sign in"}</h1>
        <p className="small text-body-secondary">
          {isRegister ? "Save recommendation history, manage farms and run batch jobs." : "Welcome back to your farms and history."}
        </p>
        <form noValidate aria-label={isRegister ? "Register" : "Sign in"} onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className="d-grid gap-3">
          {fields.map((f) => (
            <Form.Group key={f.name} controlId={`auth-${f.name}`}>
              <Form.Label className="small fw-medium mb-1">{f.label}</Form.Label>
              <Form.Control type={f.type} autoComplete={f.autoComplete} isInvalid={Boolean(errors[f.name])} {...register(f.name)} />
              <Form.Control.Feedback type="invalid" role="alert">{errors[f.name]?.message}</Form.Control.Feedback>
            </Form.Group>
          ))}
          <ErrorAlert error={mutation.error} />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner size="sm" className="me-2" aria-hidden />}
            {isRegister ? "Create account" : "Sign in"}
          </Button>
          <p className="small text-center mb-0">
            {isRegister ? "Already have an account? " : "New here? "}
            <Link to={{ pathname: isRegister ? "/login" : "/register", search: params.toString() }}>
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </Card.Body>
    </Card>
  );
}
