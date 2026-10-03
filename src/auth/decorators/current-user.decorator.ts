import { createParamDecorator } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_, ctx) => {
  const req: { user: { userId: string; email: string } } = ctx
    .switchToHttp()
    .getRequest();
  return req.user;
});
