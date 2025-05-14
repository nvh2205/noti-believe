import { registerAs } from '@nestjs/config';

export const configCache = registerAs('cache', () => ({
  api: {
    cache_ttl: 10000,
    exclude_routes: [
      '/crypto/btc/daily-prices',
    ],
  },
}));
