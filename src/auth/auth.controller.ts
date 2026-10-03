import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UnauthorizedException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { Response, Request } from 'express';
import { TokensService } from './services/tokens.service';
import { JwtAuthGuard } from './auth.guard';
import { CookiesService } from './services/cookies.service';
import { LogoutService } from './services/logout.service';
import { ApiResponse } from '@nestjs/swagger';
import { LoginEntity } from './entities/login.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService,
    private readonly cookiesService: CookiesService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('/register')
  async register(@Body() dto: RegisterDTO) {
    return await this.authService.registerUser(dto);
  }

  @Post('/login')
  @ApiResponse({ status: 201, type: LoginEntity })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.authService.loginUser(dto);

    this.cookiesService.setRefreshCookie(res, refresh_token);

    return { access_token };
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.cookiesService.getRefreshCookie(req);

    if (!refreshToken)
      throw new UnauthorizedException('Refresh token is invalid');

    const { access_token, refresh_token } =
      await this.tokensService.refreshTokens(refreshToken);

    this.cookiesService.setRefreshCookie(res, refresh_token);

    return { access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.logoutService.logoutUser(req, res);
  }
}
