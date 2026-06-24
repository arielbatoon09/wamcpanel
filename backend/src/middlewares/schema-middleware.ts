import type { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { ValidationException } from "@/exceptions";

export class SchemaMiddleware {
  public static validate(schema: ZodTypeAny) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validated = (await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        })) as { body?: any; query?: any; params?: any };

        if (validated.body !== undefined) {
          req.body = validated.body;
        }

        if (validated.query !== undefined) {
          for (const key in req.query) {
            delete req.query[key];
          }
          Object.assign(req.query, validated.query);
        }

        if (validated.params !== undefined) {
          for (const key in req.params) {
            delete req.params[key];
          }
          Object.assign(req.params, validated.params);
        }

        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const errorList = error.issues.map(issue => {
            const fullPath = issue.path.join(".");
            const cleanPath = issue.path.filter(p => p !== "body" && p !== "query" && p !== "params").join(".");
            return {
              path: cleanPath || fullPath,
              message: issue.message,
            };
          });

          throw new ValidationException("Validation failed", errorList);
        }
        return next(error);
      }
    };
  }
}
