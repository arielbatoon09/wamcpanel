import type { Response } from "express";
import { logger } from "@/lib/logger";
import { envConfig } from "@/config/env";

interface SuccessResponseOptions {
  res: Response;
  message: string;
  data?: any;
  statusCode?: number;
}

interface ErrorResponseOptions {
  res: Response;
  message: string;
  statusCode?: number;
  error?: any;
  errors?: any[];
}

export const sendSuccess = ({ res, message, data, statusCode = 200 }: SuccessResponseOptions) => {
  logger.info(`Success [${statusCode}]: ${message}`);

  return res.status(statusCode).json({
    status: "success",
    message,
    ...(data !== undefined && { data }),
  });
};

export const sendError = ({ res, message, statusCode = 500, error, errors }: ErrorResponseOptions) => {
  logger.error(`Error [${statusCode}]: ${message}`, { error });

  const isProduction = envConfig.STAGE === "prod";

  return res.status(statusCode).json({
    status: "error",
    message: isProduction && statusCode === 500 ? "Internal Server Error" : message,
    ...(errors !== undefined && { errors }),
    ...(!isProduction &&
      error && {
        details: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      }),
  });
};
