import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[] = exception.message;
    let errorCode: string = 'INTERNAL_ERROR';
    let details: Record<string, any> = {};

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, any>;
      message = respObj.message || exception.message;
      errorCode = respObj.errorCode || HttpStatus[status] || 'ERROR';

      // Capture any extra contextual details (e.g. conflictingPostId)
      if (respObj.details) {
        details = respObj.details;
      }
      if (respObj.conflictingPostId) {
        details.conflictingPostId = respObj.conflictingPostId;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
