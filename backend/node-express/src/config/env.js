// Centralised, validated configuration (fails fast on bad values).
import { z } from "zod";

const DEV_SECRET = "dev-only-insecure-secret-change-me"; // same default as the FastAPI service

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4100),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/agrioptima"),
    JWT_SECRET: z.string().default(DEV_SECRET),
    JWT_ISSUER: z.string().default("agrioptima-api"),
    JWT_AUDIENCE: z.string().default("agrioptima"),
    CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:8080"),
    AGRI_API_URL: z.string().url().default("http://localhost:8000/api"),
    AWS_REGION: z.string().default("ap-south-1"),
    S3_BUCKET: z.string().optional(),
    S3_PUBLIC_BASE_URL: z.string().url().optional(), // e.g. a CloudFront domain
    LOG_LEVEL: z.string().default("info"),
    // Optional: with Redis, Socket.IO events reach clients on every replica (Redis adapter).
    REDIS_URL: z.string().optional(),
  })
  .refine((e) => e.NODE_ENV !== "production" || (e.JWT_SECRET !== DEV_SECRET && e.JWT_SECRET.length >= 32), {
    message: "Set JWT_SECRET (>= 32 chars) in production",
    path: ["JWT_SECRET"],
  });

export const env = schema.parse(process.env);
export const corsOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
