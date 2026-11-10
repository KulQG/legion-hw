import { Injectable } from '@nestjs/common';
import { Response, Request } from 'express';

const REFRESH_COOKIE_KEY = 'refresh_token';

@Injectable()
export class CookiesService {
  getRefreshCookie(req: Request) {
    return req.cookies[REFRESH_COOKIE_KEY] as string;
  }

  setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_KEY, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
    });
  }
}
