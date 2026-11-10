import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  NOTIFICATION_SERVICE_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(8081),
  MONGO_URL: z.string().trim().min(1),
});

export default registerAs('app', () => {
  const env = schema.parse(process.env);

  return {
    port: env.NOTIFICATION_SERVICE_PORT,
  };
});
