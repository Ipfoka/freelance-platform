import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class PayoutsService {
  private readonly FEE_RATE = 0.025;

  constructor(private prisma: PrismaService) {}

  async createPayoutRequest(userId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance for payout');
    }

    const fee = Number((amount * this.FEE_RATE).toFixed(2));

    const result = await this.prisma.$transaction(async (tx) => {
      const payoutRequest = await tx.payoutRequest.create({
        data: {
          amount,
          userId,
          status: 'pending',
          fee,
        },
      });

      await tx.transaction.create({
        data: {
          amount,
          type: 'withdrawal',
          description: `Payout request #${payoutRequest.id}`,
          payoutRequestId: payoutRequest.id,
        },
      });

      await tx.transaction.create({
        data: {
          amount: fee,
          type: 'fee',
          description: `Payout fee for request #${payoutRequest.id}`,
          payoutRequestId: payoutRequest.id,
        },
      });

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
        },
      });

      return payoutRequest;
    });

    return result;
  }

  async processPayout(payoutId: string) {
    const payoutRequest = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
    });

    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    return this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'processed' },
    });
  }

  async adminProcessPayout(payoutId: string) {
    const payoutRequest = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
    });

    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    if (payoutRequest.status !== 'pending') {
      throw new BadRequestException('Payout request is not in pending status');
    }

    return this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'processed' },
    });
  }
}
