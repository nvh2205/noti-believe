import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from '@/api/filters/GlobalExceptionFilter';
import { Logger as PinoLogger } from 'nestjs-pino';

const isApi = Boolean(Number(process.env.IS_API || 0));
const isWorker = Boolean(Number(process.env.IS_WORKER || 0));

const PORT = process.env.PORT || '3000';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false,
    // bufferLogs: true,
  });

  if (isApi) {
    app.useLogger(app.get(PinoLogger));
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    app.enableCors({
      origin: '*',
    });

    app.useGlobalFilters(new GlobalExceptionFilter(true, true));

    if (process.env.APP_ENV !== 'production') {
      const options = new DocumentBuilder()
        .setTitle('API docs')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, options);
      SwaggerModule.setup('docs', app, document);
    }
  } else if (isWorker) {
    // Worker-specific setup if needed
    Logger.log('Starting in worker mode');
    app.useLogger(app.get(PinoLogger));
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
  } else {
    // Default mode
    Logger.log('Starting in default mode');
    app.useLogger(app.get(PinoLogger));
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
  }

  // Start HTTP server for all modes
  await app.listen(PORT);
  Logger.log(`🚀 Application is running on port ${PORT}`);
}
bootstrap();
