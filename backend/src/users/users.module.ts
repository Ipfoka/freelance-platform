import { Module } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from './users.controller';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
