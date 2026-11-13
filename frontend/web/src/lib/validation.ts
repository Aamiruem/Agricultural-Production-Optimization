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
