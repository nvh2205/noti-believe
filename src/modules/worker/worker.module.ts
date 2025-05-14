import {
  Module,
  OnModuleInit,
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configQueue } from './configs';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import Redis from 'ioredis';
import { DatabaseModule } from '@/database';
import { AxiomWebSocketService } from './services/axiom-websocket.service';
import { ScheduleService } from './schedulers/schedule.service';
import { TokenProcessorService } from './processors/token-processor.service';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';

// Provider to check Redis connection
@Injectable()
class RedisStatusProvider implements OnModuleInit {
  private readonly logger = new Logger('RedisStatusProvider');

  constructor(@Inject('REDIS_STATE') private readonly redisClient: Redis) {}

  async onModuleInit() {
    try {
      const pong = await this.redisClient.ping();
      this.logger.log(
        `✅ Redis connection established! Ping response: ${pong}`,
      );
    } catch (error) {
      this.logger.error(`🔴 Redis connection failed: ${error.message}`);
    }
  }
}

@Module({
  imports: [
    DatabaseModule,
    TelegramBotModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory(config: ConfigService) {
        const host = config.get<string>('queue.host');
        const port = config.get<number>('queue.port');
        const db = config.get<number>('queue.database');
        const password = config.get<string>('queue.password');
        return {
          redis: {
            host: host,
            port: port,
            db: db,
            password: password,
            // tls,
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configQueue],
    }),
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'token-queue',
    }),
  ],
  controllers: [],
  providers: [
    RedisStatusProvider, 
    AxiomWebSocketService, 
    ScheduleService,
    TokenProcessorService
  ],
  exports: [AxiomWebSocketService],
})
export class WorkerModule {}
