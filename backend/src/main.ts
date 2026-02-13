import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableShutdownHooks();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`,
      );
    });

    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    : [];
  const allowNetlifyOrigins = ['true', '1'].includes(
    (process.env.CORS_ALLOW_NETLIFY || '').toLowerCase(),
  );
  const allowAnyOrigin = configuredOrigins.length === 0 && !allowNetlifyOrigins;

  const corsOriginResolver = (origin: string | undefined): boolean => {
    if (!origin) {
      return true;
    }

    if (allowAnyOrigin) {
      return true;
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (configuredOrigins.includes(normalizedOrigin)) {
      return true;
    }

    if (allowNetlifyOrigins) {
      try {
        const parsed = new URL(normalizedOrigin);
        if (parsed.hostname.endsWith('.netlify.app')) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (corsOriginResolver(origin)) {
        callback(null, true);
        return;
      }

      logger.warn(`Blocked by CORS policy: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    optionsSuccessStatus: 204,
  });

  const config = new DocumentBuilder()
    .setTitle('Freelance Platform API')
    .setDescription('API documentation for the freelance platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI is available at: http://localhost:${port}/api`);
}

bootstrap();
