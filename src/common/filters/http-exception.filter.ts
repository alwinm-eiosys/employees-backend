import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

// Gives every HttpException (400, 404, validation errors...) one response shape
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const body = exception.getResponse();

    // validation errors give an array of messages, others give a string
    const message =
      typeof body === 'string'
        ? body
        : ((body as { message?: string | string[] }).message ?? exception.message);

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
