import { z } from "zod";

// Zod schemas shared by React Hook Form (client validation) and tests.
// Ranges match the Pydantic constraints in the FastAPI backend.

const num = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label} is required` })
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

export const soilSchema = z.object({
  N: num("Nitrogen", 0, 200),
  P: num("Phosphorus", 0, 200),
  K: num("Potassium", 0, 250),
  temperature: num("Temperature", -10, 55),
  humidity: num("Humidity", 0, 100),
  ph: num("pH", 0, 14),
  rainfall: num("Rainfall", 0, 500),
});
export type SoilFormValues = z.infer<typeof soilSchema>;

export const fertilizerSchema = z.object({
  crop: z.string().min(1, "Choose a crop"),
  N: num("Nitrogen", 0, 200),
  P: num("Phosphorus", 0, 200),
  K: num("Potassium", 0, 250),
  area_ha: num("Area", 0.1, 100),
});
export type FertilizerFormValues = z.infer<typeof fertilizerSchema>;

export const fieldSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40),
  crop: z.string().min(1, "Choose a crop"),
  areaHa: num("Area", 0.1, 1000),
  season: z.enum(["kharif", "rabi", "zaid", "perennial"], { error: "Choose a season" }),
});
export type FieldFormValues = z.infer<typeof fieldSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128)
    .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), "Mix letters and numbers"),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const newFarmSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  state: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
});
export type NewFarmValues = z.infer<typeof newFarmSchema>;

const optionalNum = (label: string, max: number) =>
  z.union([z.nan(), z.number().min(0, `${label} must be ≥ 0`).max(max, `${label} must be ≤ ${max}`)]).optional();

export const newFieldSchema = fieldSchema.extend({
  N: optionalNum("N", 200),
  P: optionalNum("P", 200),
  K: optionalNum("K", 250),
});
export type NewFieldValues = z.infer<typeof newFieldSchema>;
