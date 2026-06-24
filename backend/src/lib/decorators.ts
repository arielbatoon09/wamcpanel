import type { Request, Response, NextFunction } from "express";

export function AsyncController() {
  return function (target: any, contextOrKey: any, descriptor?: PropertyDescriptor): any {
    if (contextOrKey && typeof contextOrKey === "object" && contextOrKey.kind === "method") {
      const originalMethod = target;
      return async function (this: any, req: Request, res: Response, next: NextFunction) {
        try {
          return await originalMethod.call(this, req, res, next);
        } catch (error) {
          next(error);
        }
      };
    }

    if (descriptor) {
      const originalMethod = descriptor.value;
      descriptor.value = async function (this: any, req: Request, res: Response, next: NextFunction) {
        try {
          return await originalMethod.call(this, req, res, next);
        } catch (error) {
          next(error);
        }
      };
      return descriptor;
    }
  };
}
