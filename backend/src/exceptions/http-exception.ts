export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly errors?: any[];

  constructor(statusCode: number, message: string, errors?: any[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = "error";
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
