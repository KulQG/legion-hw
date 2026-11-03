import {
  createParamDecorator,
  ExecutionContext,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request } from 'express';

const extractIdempotencyKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): unknown => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.headers['idempotency-key'];
  },
);

export const IdempotencyKey = () =>
  extractIdempotencyKey(undefined, new ParseUUIDPipe());
