import { DatabaseModule } from '@/database';
import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configTelegram } from './configs/telegram';
import { TelegramBot } from './telegram-bot';
import Redis from 'ioredis';
import { HandlerService } from './services/handler.service';
import { CallbackHandler, StartHandler } from './handlers/start.handler';
import { UserInputHandler } from './handlers/user-input.handler';

const handlers = [StartHandler, UserInputHandler, CallbackHandler];

const services = [HandlerService];

@Global()
@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configTelegram],
    }),
  ],
  controllers: [],
  providers: [
    ...handlers,
    TelegramBot,
    ...services,
    {
      provide: 'TELEGRAM_BOT_STATE',
      useFactory: (configService: ConfigService) => {
        const family =
          configService.get<number>('telegram.state.family') ||
          Number(process.env.REDIS_FAMILY || 0);
        const url =
          configService.get<string>('telegram.state.url') + `?family=${family}`;
        const redis = new Redis(url);
        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [TelegramBot],
})
export class TelegramBotModule implements OnModuleInit {
  constructor(
    private telegramBot: TelegramBot,
    private handlerService: HandlerService,
  ) {}
  async onModuleInit() {
    const handlers = this.handlerService.getHandlers();
    this.telegramBot.registerHandlers(handlers);
    await this.telegramBot.start();
  }
}
