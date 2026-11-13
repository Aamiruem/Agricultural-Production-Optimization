import { z } from "zod";

// Zod schemas for React Hook Form. Ranges match the FastAPI (Pydantic) limits.

const num = (label, min, max) =>
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

export const fertilizerSchema = z.object({
  crop: z.string().min(1, "Choose a crop"),
  N: num("Nitrogen", 0, 200),
  P: num("Phosphorus", 0, 200),
  K: num("Potassium", 0, 250),
  area_ha: num("Area", 0.1, 100),
});

export const plannerFieldSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40),
  crop: z.string().min(1, "Choose a crop"),
  areaHa: num("Area", 0.1, 1000),
  season: z.enum(["kharif", "rabi", "zaid", "perennial"], { error: "Choose a season" }),
});

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

export const farmSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  district: z.string().trim().max(60).optional(),
  state: z.string().trim().max(60).optional(),
});

const optionalNum = (label, max) =>
  z.union([z.nan(), z.number().min(0, `${label} must be ≥ 0`).max(max, `${label} must be ≤ ${max}`)]).optional();

export const farmFieldSchema = plannerFieldSchema.extend({
  N: optionalNum("N", 200),
  P: optionalNum("P", 200),
  K: optionalNum("K", 250),
});
