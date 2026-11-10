import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  USER_SERVICE_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  CRON_SCHEDULE: z.string().trim().min(1),
});

export default registerAs('app', () => {
  const env = schema.parse(process.env);

  return {
    port: env.USER_SERVICE_PORT,
    cron_schedule: env.CRON_SCHEDULE,
  };
});
