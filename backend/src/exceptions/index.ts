import { HttpException } from "./http-exception";

export { HttpException };

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", errors?: any[]) {
    super(400, message, errors);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

export class ConflictException extends HttpException {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

export class ValidationException extends HttpException {
  constructor(message = "Validation failed", errors?: any[]) {
    super(400, message, errors);
  }
}
