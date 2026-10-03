import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { RegisterDTO } from '../dto/register.dto';
import { TokensService } from './tokens.service';

const INVALID_LOGIN_MESSAGE = 'email or password is incorrect';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async registerUser(registerData: RegisterDTO) {
    const { password, ...userInfo } = registerData;

    const passwordHash = await bcrypt.hash(password, 10);

    await this.usersService.create({ ...userInfo, passwordHash });
  }

  async loginUser(loginData: LoginDto) {
    const foundUser = await this.usersService.findForLogin(loginData.email);

    if (!foundUser) throw new UnauthorizedException(INVALID_LOGIN_MESSAGE);

    const isValidPassword = await bcrypt.compare(
      loginData.password,
      foundUser.passwordHash,
    );

    if (!isValidPassword)
      throw new UnauthorizedException(INVALID_LOGIN_MESSAGE);

    return await this.tokensService.generateTokens(
      foundUser.id,
      foundUser.email,
    );
  }
}
