import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  MONGO_URL: z.string().trim().min(1),
});

export default registerAs('mongo', () => {
  const env = schema.parse(process.env);

  return {
    url: env.MONGO_URL,
  };
});
