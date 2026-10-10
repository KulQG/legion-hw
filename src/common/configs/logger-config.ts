import { Params } from 'nestjs-pino';
import { getRequestId } from '../helpers/get-request-id';
import { Request, Response } from 'express';

export const LOGGER_CONFIG: Params<Request, Response> = {
  pinoHttp: {
    genReqId: (req, res) => {
      const requestId = getRequestId(req);

      res.setHeader('X-Request-Id', requestId);

      return requestId;
    },

    autoLogging: false,

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers.x-api-key',
        'password',
        '*.password',
        'token',
        '*.token',
        'accessToken',
        'refreshToken',
      ],
      censor: '[REDACTED]',
    },
  },
};
