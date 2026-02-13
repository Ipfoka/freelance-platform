import { Module } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { PrismaService } from './prisma/prisma.service';

@Module({
  providers: [PayoutsService, PrismaService],
  controllers: [PayoutsController],
  exports: [PayoutsService],
})
export class PayoutsModule {}
