import { registerAs } from '@nestjs/config';
import z from 'zod';

const schema = z.object({
  REDIS_URL: z.string().trim().min(1),
});

export default registerAs('redis', () => {
  const env = schema.parse(process.env);

  return {
    url: env.REDIS_URL,
  };
});
