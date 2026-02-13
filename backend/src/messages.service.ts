import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { S3Service } from './s3/s3.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async createMessage(
    dealId: string,
    senderId: string,
    content: string,
    attachmentUrl?: string,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.senderId !== senderId && deal.receiverId !== senderId) {
      throw new ForbiddenException('Only deal participants can send messages');
    }

    return this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId:
          deal.senderId === senderId ? deal.receiverId : deal.senderId,
        dealId,
        attachmentUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getMessages(dealId: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.senderId !== userId && deal.receiverId !== userId) {
      throw new ForbiddenException(
        'Only deal participants can access messages',
      );
    }

    return this.prisma.message.findMany({
      where: {
        dealId,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getUploadUrl(
    userId: string,
    dealId: string,
    fileName: string,
    fileType: string,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.senderId !== userId && deal.receiverId !== userId) {
      throw new ForbiddenException('Only deal participants can upload files');
    }

    const key = `messages/${dealId}/${userId}/${Date.now()}-${fileName}`;
    return this.s3Service.getUploadUrl(key, fileType);
  }
}
