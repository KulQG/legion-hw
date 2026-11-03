import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  JWT_SECRET: z.string().trim().min(1),
  REFRESH_JWT_SECRET: z.string().trim().min(1),
});

export default registerAs('jwt', () => {
  const env = schema.parse(process.env);

  return {
    secret: env.JWT_SECRET,
    refresh_secret: env.REFRESH_JWT_SECRET,
  };
});
