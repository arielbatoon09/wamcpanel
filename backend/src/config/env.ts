import { config } from "dotenv";
import { z } from "zod";
import { STAGES } from "@/constants/env";

config();

export function isTest() {
  return process.env.NODE_ENV === "test";
}

const envSchema = z.object({
  APP_NAME: z.string().default("WAMCPanel API"),
  PORT: z.coerce.number().default(8000),
  STAGE: z.nativeEnum(STAGES).default(STAGES.Dev),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
});

const parseEnvironment = () => {
  try {
    return envSchema.parse({
      APP_NAME: process.env.APP_NAME,
      PORT: process.env.PORT,
      STAGE: process.env.STAGE || (process.env.NODE_ENV === "production" ? STAGES.Prod : STAGES.Dev),
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      JWT_SECRET: process.env.JWT_SECRET,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("\nEnvironment Variable Validation Failed:");
      error.issues.forEach(err => {
        const path = err.path.join(".");
        console.error(`- ${path}: ${err.message}`);
      });
      console.error("");
    } else {
      console.error("❌ Unknown configuration error:", error);
    }
    process.exit(1);
  }
};

const parsedEnv = parseEnvironment();

process.env.DATABASE_URL = parsedEnv.DATABASE_URL;
process.env.REDIS_URL = parsedEnv.REDIS_URL;

export const envConfig = {
  ...parsedEnv,
};

export type EnvConfig = typeof envConfig;
