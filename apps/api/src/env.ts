import type { CivicAuth } from '@civic/auth/server';
import type { HonoCookieStorage } from './services/cookies.service';

interface Bindings {
  storage: HonoCookieStorage;
  civicAuth: CivicAuth;
}

interface Variables {
  BUN_ENV: 'production' | 'development';

  DATABASE_URL: string;

  storage: HonoCookieStorage;
  civicAuth: CivicAuth;
}

export type Env<WITH_ROOT_BINDINGS = false> = {
  Bindings: Bindings & Variables;
  Variables: Variables;
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
} & (WITH_ROOT_BINDINGS extends true ? Bindings & Variables : {});
