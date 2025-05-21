import { Module } from '@nestjs/common';
import { configDb } from './configs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from '@/worker/entities/token.entity';
import { TokenRepository } from '@/worker/repositories/token.repository';

const repositories = [TokenRepository];

const services = [];

const entities = [Token];
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        ...config.get('db'),
        entities: [...entities],
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configDb],
    }),
  ],
  controllers: [],
  providers: [...repositories, ...services],
  exports: [...repositories, ...services],
})
export class DatabaseModule {}
