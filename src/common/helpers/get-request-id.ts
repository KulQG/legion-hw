import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

export function getRequestId(req: Request): string {
  if (typeof req.id === 'string' && req.id.length > 0) {
    return req.id;
  }

  const header = req.headers['x-request-id'];

  const requestId =
    typeof header === 'string' && header.length <= 128 ? header : randomUUID();

  req.id = requestId;

  return requestId;
}
