import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth.module';
import { UsersModule } from './users/users.module';
import { S3Module } from './s3/s3.module';
import { ProjectsModule } from './projects.module';
import { DealsModule } from './deals.module';
import { PayoutsModule } from './payouts.module';
import { MessagesModule } from './messages/messages.module';
import { DisputesModule } from './disputes.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().integer().min(1).max(65535).default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_REFRESH_SECRET: Joi.string().min(16).optional(),
        STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
        STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
        REDIS_URL: Joi.string().uri().optional(),
        CORS_ORIGIN: Joi.string().optional(),
        RATE_LIMIT_TTL: Joi.number().integer().min(1).default(60),
        RATE_LIMIT_LIMIT: Joi.number().integer().min(1).default(120),
        PLATFORM_COMMISSION_RATE: Joi.number().min(0).max(0.9).default(0.1),
        PROFILE_BOOST_PRICE: Joi.number().min(0.01).default(15),
        PROFILE_BOOST_DAYS: Joi.number().integer().min(1).default(14),
        INVITE_LIMIT_FREE: Joi.number().integer().min(1).default(3),
        INVITE_LIMIT_PRO: Joi.number().integer().min(1).default(10),
        INVITE_LIMIT_BUSINESS: Joi.number().integer().min(1).default(25),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000,
          limit: configService.get<number>('RATE_LIMIT_LIMIT', 120),
        },
      ],
    }),
    AuthModule,
    UsersModule,
    S3Module,
    ProjectsModule,
    DealsModule,
    PayoutsModule,
    MessagesModule,
    DisputesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
