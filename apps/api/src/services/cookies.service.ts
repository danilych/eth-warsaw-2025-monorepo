import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { CookieStorage } from '@civic/auth/server';

export class HonoCookieStorage extends CookieStorage {
  constructor(private c: Context) {
    const isHttps =
      c.req.header('x-forwarded-proto') === 'https' ||
      c.req.url.startsWith('https://');

    super({
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      httpOnly: false,
      path: '/',
    });
  }

  async get(key: string) {
    return getCookie(this.c, key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    setCookie(this.c, key, value, this.settings);
  }

  async delete(key: string): Promise<void> {
    deleteCookie(this.c, key);
  }
}
