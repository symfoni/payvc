// @ts-check
/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const { z } = require('zod');

/*eslint sort-keys: "error"*/
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  // GITHUB_ID: z.string().min(3),
  // GITHUB_SECRET: z.string().min(3)
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ Invalid environment variables:',
    // @ts-ignore
    JSON.stringify(env.error.format(), null, 4),
  );
  process.exit(1);
}
module.exports.env = env.data;
