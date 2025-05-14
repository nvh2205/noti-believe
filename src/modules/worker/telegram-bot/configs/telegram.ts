import { registerAs } from '@nestjs/config';

export const configTelegram = registerAs('telegram', () => ({
  token: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID,
  state: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    database: process.env.REDIS_DATABASE || 1,
    password: process.env.REDIS_PASSWORD || null,
    maxRetriesPerRequest: null,
    tls: null,
    family: parseInt(process.env.REDIS_FAMILY) || 0,
    url: process.env.REDIS_URL || null,
  },
}));
