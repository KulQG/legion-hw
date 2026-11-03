import { createParamDecorator } from '@nestjs/common';
import { USER_FROM_TOKEN } from '../../common/types';

export const CurrentUser = createParamDecorator((_, ctx) => {
  const req: { user: USER_FROM_TOKEN } = ctx.switchToHttp().getRequest();
  return req.user;
});
