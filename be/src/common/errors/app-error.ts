import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export class AppError extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        success: false,
        statusCode,
        errorCode,
        message,
        details: details || {},
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class ValidationAppError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, any>) {
    super(errorCode, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class NotFoundAppError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, any>) {
    super(errorCode, message, HttpStatus.NOT_FOUND, details);
  }
}

export class ForbiddenAppError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, any>) {
    super(errorCode, message, HttpStatus.FORBIDDEN, details);
  }
}

export class ConflictAppError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, any>) {
    super(errorCode, message, HttpStatus.CONFLICT, details);
  }
}
