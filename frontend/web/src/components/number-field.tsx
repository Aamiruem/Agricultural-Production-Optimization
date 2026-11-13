import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberFieldProps {
  id: string;
  label: string;
  unit?: string;
  step?: number;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

/** shadcn/ui Label + Input wired to React Hook Form, with accessible errors. */
export function NumberField({ id, label, unit, step = 1, registration, error }: NumberFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {unit && <span className="font-normal text-muted-foreground">({unit})</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
