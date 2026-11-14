// Zod request schemas (validation at the edge; Mongoose validates again on save).
import { z } from "zod";

import { ACTIVITY_TYPES } from "../models/activity.model.js";
import { FIELD_STATUSES, SEASONS } from "../models/field.model.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const idParams = z.object({ id: objectId });
export const farmIdParams = z.object({ farmId: objectId });

export const createFarm = z.object({
  name: z.string().trim().min(2).max(80),
  location: z
    .object({
      state: z.string().trim().max(60).optional(),
      district: z.string().trim().max(60).optional(),
      village: z.string().trim().max(80).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    })
    .optional(),
});
export const updateFarm = createFarm.partial();

const soil = z.object({
  N: z.number().min(0).max(200).optional(),
  P: z.number().min(0).max(200).optional(),
  K: z.number().min(0).max(250).optional(),
  ph: z.number().min(0).max(14).optional(),
});

export const createField = z.object({
  name: z.string().trim().min(1).max(80),
  crop: z.string().trim().toLowerCase().min(2).max(40),
  season: z.enum(SEASONS),
  areaHa: z.number().positive().max(10000),
  status: z.enum(FIELD_STATUSES).optional(),
  soil: soil.optional(),
});
export const updateField = createField.partial();

export const createActivity = z.object({
  type: z.enum(ACTIVITY_TYPES),
  notes: z.string().max(500).optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(20).optional(),
  date: z.coerce.date().optional(),
});

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const presignPhoto = z.object({
  contentType: z.enum(IMAGE_TYPES),
  size: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024, "Max 5 MB"),
});
export const recordPhoto = z.object({ key: z.string().min(10).max(300) });

export const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
