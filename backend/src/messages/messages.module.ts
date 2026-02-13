import { Module } from '@nestjs/common';
import { MessagesService } from '../messages.service';
import { MessagesGateway } from '../messages.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  providers: [MessagesService, MessagesGateway, PrismaService],
  exports: [MessagesService],
})
export class MessagesModule {}
