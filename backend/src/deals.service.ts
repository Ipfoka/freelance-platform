import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateDealDto } from './deals/dto/create-deal.dto';
import Stripe from 'stripe';

@Injectable()
export class DealsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private getPlatformCommissionRate(): number {
    const raw = Number(process.env.PLATFORM_COMMISSION_RATE || 0.1);
    if (!Number.isFinite(raw)) {
      return 0.1;
    }
    return Math.min(Math.max(raw, 0), 0.9);
  }

  async createDeal(userId: string, dealData: CreateDealDto) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY is not configured',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'client') {
      throw new ForbiddenException('Only clients can create deals');
    }

    const proposal = await this.prisma.proposal.findUnique({
      where: { id: dealData.proposalId },
      include: {
        project: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.project.userId !== userId) {
      throw new ForbiddenException('Proposal does not belong to your project');
    }

    const deal = await this.prisma.deal.create({
      data: {
        projectId: proposal.projectId,
        proposalId: dealData.proposalId,
        senderId: user.id,
        receiverId: proposal.senderId,
        amount: dealData.amount,
        currency: dealData.currency || 'USD',
        status: 'created',
      },
    });

    try {
      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });

        stripeCustomerId = customer.id;

        await this.prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId },
        });
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(dealData.amount * 100),
        currency: (dealData.currency || 'USD').toLowerCase(),
        customer: stripeCustomerId,
        metadata: {
          dealId: deal.id,
        },
      });

      const updatedDeal = await this.prisma.deal.update({
        where: { id: deal.id },
        data: {
          escrowPaymentId: paymentIntent.id,
        },
      });

      return {
        deal: updatedDeal,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error: any) {
      await this.prisma.deal.delete({
        where: { id: deal.id },
      });

      throw new BadRequestException(`Error creating payment: ${error.message}`);
    }
  }

  async handlePaymentSuccess(dealId: string) {
    return this.prisma.deal.update({
      where: { id: dealId },
      data: { status: 'escrowed' },
    });
  }

  async confirmDeal(dealId: string, clientId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.senderId !== clientId) {
      throw new ForbiddenException('You can only confirm your own deals');
    }

    if (deal.status !== 'escrowed') {
      throw new BadRequestException(
        'Deal must be in escrowed status to confirm',
      );
    }

    const commissionRate = this.getPlatformCommissionRate();
    const platformFee = this.roundMoney(deal.amount * commissionRate);
    const freelancerAmount = this.roundMoney(
      Math.max(deal.amount - platformFee, 0),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { userId: deal.receiverId },
        create: {
          userId: deal.receiverId,
          balance: 0,
          pending: 0,
          currency: deal.currency,
        },
        update: {},
      });

      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: { status: 'released' },
      });

      await tx.wallet.update({
        where: { userId: deal.receiverId },
        data: {
          balance: { increment: freelancerAmount },
        },
      });

      await tx.transaction.create({
        data: {
          amount: deal.amount,
          type: 'escrow_release',
          description: `Release funds for deal ${dealId}`,
          dealId,
        },
      });

      await tx.transaction.create({
        data: {
          amount: freelancerAmount,
          type: 'credit',
          description: `Net payout for deal ${dealId}`,
          dealId,
        },
      });

      await tx.transaction.create({
        data: {
          amount: platformFee,
          type: 'fee',
          description: `Platform commission for deal ${dealId}`,
          dealId,
        },
      });

      return updatedDeal;
    });

    return {
      ...result,
      platformFee,
      freelancerAmount,
    };
  }
}
