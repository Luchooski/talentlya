import { env } from './env';

export const isProd = env.NODE_ENV === 'production';

export const cookieOpts = {
  httpOnly: true as const,
  sameSite: isProd ? ('strict' as const) : ('lax' as const), // más duro en prod
  secure: isProd,
  domain: env.COOKIE_DOMAIN || 'localhost',
  path: '/' as const,
};

export const ACCESS_TOKEN_NAME = 'access_token';
export const REFRESH_TOKEN_NAME = 'refresh_token';

export const accessTtlSec = env.ACCESS_TOKEN_TTL_MIN * 60;
export const refreshTtlSec = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

// CSRF: cookie NO httpOnly (double-submit)
export const csrfCookieName = env.CSRF_COOKIE_NAME;
export const csrfHeaderName = env.CSRF_HEADER_NAME;
