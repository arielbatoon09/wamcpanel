import type { Response } from "express";
import { sendSuccess } from "@/utils/apiResponse";
import { HttpException, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from "@/exceptions";

export abstract class BaseController {
  constructor() {
    this.autoBindMethods();
  }

  private autoBindMethods(): void {
    const prototype = Object.getPrototypeOf(this);
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const name of propertyNames) {
      if (name === "constructor") continue;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (descriptor && typeof descriptor.value === "function") {
        (this as any)[name] = descriptor.value.bind(this);
      }
    }
  }

  protected ok<T>(res: Response, data?: T, message = "Success") {
    return sendSuccess({ res, message, data, statusCode: 200 });
  }

  protected created<T>(res: Response, data?: T, message = "Created successfully") {
    return sendSuccess({ res, message, data, statusCode: 201 });
  }

  protected clientError(message = "Bad Request"): never {
    throw new BadRequestException(message);
  }

  protected unauthorized(message = "Authentication required"): never {
    throw new UnauthorizedException(message);
  }

  protected forbidden(message = "Forbidden: Insufficient privileges"): never {
    throw new ForbiddenException(message);
  }

  protected notFound(message = "Resource not found"): never {
    throw new NotFoundException(message);
  }

  protected fail(statusCode = 500, message = "Internal Server Error"): never {
    throw new HttpException(statusCode, message);
  }
}
