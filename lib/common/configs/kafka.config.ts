import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  KAFKA_URL: z.string().trim().min(1),
});

export default registerAs('kafka', () => {
  const env = schema.parse(process.env);

  return {
    url: env.KAFKA_URL,
  };
});
