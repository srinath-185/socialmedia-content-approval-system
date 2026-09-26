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
    let error = HttpStatus[status] || 'Error';
    let extraData: Record<string, any> = {};

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, any>;
      message = respObj.message || exception.message;
      error = respObj.error || error;
      // Pass through any custom fields (e.g. conflictingPostId for 409)
      const { message: _, error: __, statusCode: ___, ...rest } = respObj;
      extraData = rest;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      ...extraData,
      timestamp: new Date().toISOString(),
    });
  }
}
