import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export const requestLogger = (req: any, res: any, next: any) => next();
export const errorLogger = (err: any, req: any, res: any, next: any) => next(err);
