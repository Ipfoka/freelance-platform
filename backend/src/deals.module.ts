import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaService } from './prisma/prisma.service';

@Module({
  providers: [DealsService, PrismaService],
  controllers: [DealsController, StripeWebhookController],
  exports: [DealsService],
})
export class DealsModule {}
