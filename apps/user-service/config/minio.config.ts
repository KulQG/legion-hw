import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  MINIO_URL: z.string().trim().min(1),
  MINIO_PASSWORD: z.string().trim().min(1),
  MINIO_ACCESS_KEY: z.string().trim().min(1),
  MINIO_SECRET_KEY: z.string().trim().min(1),
});

export default registerAs('minio', () => {
  const env = schema.parse(process.env);

  return {
    url: env.MINIO_URL,
    password: env.MINIO_PASSWORD,
    secret_key: env.MINIO_SECRET_KEY,
    access_key: env.MINIO_ACCESS_KEY,
  };
});
