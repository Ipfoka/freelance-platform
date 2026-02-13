import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { PrismaService } from './prisma/prisma.service';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [DisputesService, PrismaService],
  controllers: [DisputesController],
  exports: [DisputesService],
})
export class DisputesModule {}
