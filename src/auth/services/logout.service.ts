import { Injectable } from '@nestjs/common';
import { Response, Request } from 'express';
import { CookiesService } from './cookies.service';
import { TokensService } from './tokens.service';

@Injectable()
export class LogoutService {
  constructor(
    private readonly cookiesService: CookiesService,
    private readonly tokensService: TokensService,
  ) {}

  async logoutUser(req: Request, res: Response) {
    const refreshToken = this.cookiesService.getRefreshCookie(req);

    if (!refreshToken) return;

    await this.tokensService.revokeToken(refreshToken);

    this.cookiesService.clearRefreshCookie(res);
  }
}
