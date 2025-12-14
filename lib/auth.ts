import { betterAuth } from 'better-auth';
import { expo } from '@better-auth/expo';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  plugins: [expo()],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  trustedOrigins: [
    'rawhash://',
    'rawhash://*',
    // Development origins for Expo
    ...(process.env.NODE_ENV === 'development'
      ? [
          'exp://*/*',
          'exp://192.168.*.*:*/*',
          'exp://localhost:*/*',
          'http://localhost:8081',
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
