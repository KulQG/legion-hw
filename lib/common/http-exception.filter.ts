import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestId } from './helpers/get-request-id';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    const requestId = getRequestId(request);
    const code =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const value =
        typeof body === 'string'
          ? body
          : (body as { message?: unknown }).message;

      if (typeof value === 'string') {
        message = value;
      } else if (Array.isArray(value)) {
        message = value
          .filter((item): item is string => typeof item === 'string')
          .join('; ');
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error(
        `Unhandled HTTP exception, requestId=${requestId}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(code).json({ message, requestId, code });
  }
}
