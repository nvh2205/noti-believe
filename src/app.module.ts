import { Module, RequestMethod, Global } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkerModule } from './modules/worker/worker.module';

// Create a global Redis module
@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_STATE',
      useFactory: () => {
        const family = Number(process.env.REDIS_FAMILY || 0);
        const url = `${process.env.REDIS_URL}?family=${family}`;
        const redis = new Redis(url);
        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_STATE'],
})
export class RedisModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    RedisModule,
    WorkerModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.APP_ENV === 'production' ? 'info' : 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            ignore: 'pid,hostname',
            messageFormat: '{msg}',
            translateTime: 'SYS:standard',
          },
        },
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        customSuccessMessage: (req, res) => {
          if (req && res) {
            return `${req.method} ${req.url}`;
          }
          return 'Request completed';
        },
        customErrorMessage: (req, res, error) => {
          if (req) {
            return `${req.method} ${req.url} failed with error: ${error.message}`;
          }
          return 'Request failed';
        },
      },
      exclude: [{ method: RequestMethod.ALL, path: 'health' }],
    }),
  ],
})
export class AppModule {}
