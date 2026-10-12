import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Turns Postgres errors into proper HTTP responses
@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const driverError = exception.driverError as {
      code?: string;
      detail?: string;
    };

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong. Please try again later.';

    if (driverError?.code === '23505') {
      // unique violation, detail looks like: Key (email)=(a@b.com) already exists.
      status = HttpStatus.CONFLICT;
      const field = /Key \((.+?)\)=/.exec(driverError.detail ?? '')?.[1];
      message = field ? `An employee with this ${field} already exists!` : 'Duplicate record!';
    } else if (driverError?.code === '23503') {
      // foreign key violation
      status = HttpStatus.BAD_REQUEST;
      message = 'Referenced record does not exist!';
    } else {
      this.logger.error(exception.message);
    }

    response.status(status).json({
      statusCode: status,
      error: status === HttpStatus.CONFLICT ? 'Conflict' : 'DatabaseError',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
