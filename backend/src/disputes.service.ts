import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { QueueService } from './queue.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async createDispute(
    dealId: string,
    userId: string,
    title: string,
    description: string,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.senderId !== userId && deal.receiverId !== userId) {
      throw new ForbiddenException(
        'Only deal participants can create disputes',
      );
    }

    if (!['created', 'escrowed'].includes(deal.status)) {
      throw new BadRequestException(
        'Cannot create dispute for this deal status',
      );
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      const createdDispute = await tx.dispute.create({
        data: {
          dealId,
          userId,
          title,
          description,
          status: 'open',
        },
      });

      await tx.deal.update({
        where: { id: dealId },
        data: { status: 'dispute' },
      });

      return createdDispute;
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await this.queueService.addEmailJob({
        to: adminEmail,
        subject: 'New dispute created',
        text: `Dispute ${dispute.id} was created for deal ${dealId}`,
      });
    }

    const adminUserId = process.env.ADMIN_USER_ID;
    if (adminUserId) {
      await this.queueService.addPushNotificationJob({
        userId: adminUserId,
        title: 'New dispute',
        body: `Dispute ${dispute.id} was created for deal ${dealId}`,
      });
    }

    return dispute;
  }

  async resolveDispute(
    disputeId: string,
    resolution: string,
    resolvedById: string,
    amount?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: resolvedById },
    });

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only admins can resolve disputes');
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        deal: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'open') {
      throw new BadRequestException('Dispute is not open');
    }

    if (!['release', 'return', 'partial'].includes(resolution)) {
      throw new BadRequestException('Invalid resolution type');
    }

    if (
      resolution === 'partial' &&
      (amount === undefined || amount <= 0 || amount >= dispute.deal.amount)
    ) {
      throw new BadRequestException(
        'For partial resolution, amount must be between 0 and deal amount',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'resolved',
          resolution,
          resolvedAt: new Date(),
          resolvedById,
        },
      });

      const nextDealStatus =
        resolution === 'release' ? 'released' : 'cancelled';

      await tx.deal.update({
        where: { id: dispute.dealId },
        data: { status: nextDealStatus },
      });

      await tx.transaction.create({
        data: {
          amount: amount ?? dispute.deal.amount,
          type: 'escrow_release',
          description: `Dispute ${disputeId} resolved: ${resolution}`,
          dealId: dispute.dealId,
        },
      });

      return updatedDispute;
    });
  }
}
