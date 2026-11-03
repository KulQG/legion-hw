import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  POSTGRES_PASSWORD: z.string().trim().min(1),
});

export default registerAs('db', () => {
  const env = schema.parse(process.env);

  return {
    url: env.DATABASE_URL,
    password: env.POSTGRES_PASSWORD,
  };
});
