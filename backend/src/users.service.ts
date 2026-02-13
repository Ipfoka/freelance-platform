import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private getBoostPrice(): number {
    const parsed = Number(process.env.PROFILE_BOOST_PRICE || 15);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 15;
    }
    return Math.round(parsed * 100) / 100;
  }

  private getBoostDays(): number {
    const parsed = Number(process.env.PROFILE_BOOST_DAYS || 14);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return 14;
    }
    return Math.floor(parsed);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
        avatar: true,
        boostedUntil: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            bio: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        wallet: {
          select: {
            id: true,
            balance: true,
            pending: true,
            currency: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async create(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'freelancer' | 'client';
    plan?: 'free' | 'pro' | 'business';
  }) {
    const { role, plan, ...rest } = userData;

    return this.prisma.user.create({
      data: {
        ...rest,
        role: role || 'freelancer',
        plan: plan || 'free',
        wallet: {
          create: {
            balance: 0,
            pending: 0,
            currency: 'USD',
          },
        },
        profile: {
          create: {},
        },
      },
    });
  }

  async update(
    userId: string,
    updateData: { firstName?: string; lastName?: string; bio?: string },
  ) {
    const { firstName, lastName, bio } = updateData;

    await this.prisma.$transaction(async (tx) => {
      if (firstName !== undefined || lastName !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(firstName !== undefined ? { firstName } : {}),
            ...(lastName !== undefined ? { lastName } : {}),
          },
        });
      }

      if (bio !== undefined) {
        await tx.profile.upsert({
          where: { userId },
          update: { bio },
          create: { userId, bio },
        });
      }
    });

    return this.findById(userId);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      await tx.profile.upsert({
        where: { userId },
        update: { avatar: avatarUrl },
        create: { userId, avatar: avatarUrl },
      });
    });

    return this.findById(userId);
  }

  async getBoostOffer() {
    const price = this.getBoostPrice();
    const days = this.getBoostDays();

    return {
      price,
      days,
      currency: 'USD',
    };
  }

  async purchaseProfileBoost(userId: string) {
    const [offer, user] = await Promise.all([
      this.getBoostOffer(),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          boostedUntil: true,
          wallet: {
            select: {
              id: true,
              balance: true,
              currency: true,
            },
          },
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'freelancer') {
      throw new ForbiddenException(
        'Only freelancers can purchase profile boost',
      );
    }

    if (!user.wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (user.wallet.balance < offer.price) {
      throw new BadRequestException(
        `Insufficient balance. Required ${offer.price.toFixed(2)} ${offer.currency}`,
      );
    }

    const now = new Date();
    const baseDate =
      user.boostedUntil && user.boostedUntil > now ? user.boostedUntil : now;
    const boostedUntil = new Date(
      baseDate.getTime() + offer.days * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: offer.price },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          boostedUntil,
        },
      });

      await tx.transaction.create({
        data: {
          amount: offer.price,
          type: 'fee',
          description: `Profile boost (${offer.days} days)`,
        },
      });
    });

    return {
      chargedAmount: offer.price,
      currency: offer.currency,
      boostedUntil,
      boostDays: offer.days,
    };
  }
}
