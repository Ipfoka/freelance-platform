/* eslint-disable @typescript-eslint/no-explicit-any */

type UserRecord = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  plan: string;
  boostedUntil?: Date | null;
  avatar?: string | null;
  hashedRefreshToken?: string | null;
  stripeCustomerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProfileRecord = {
  id: string;
  userId: string;
  bio?: string | null;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type WalletRecord = {
  id: string;
  userId: string;
  balance: number;
  pending: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectRecord = {
  id: string;
  title: string;
  description: string;
  budget: number;
  skills: string[];
  maxProposals?: number | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProposalRecord = {
  id: string;
  content: string;
  price: number;
  projectId: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type DealRecord = {
  id: string;
  projectId: string;
  proposalId?: string | null;
  senderId: string;
  receiverId: string;
  amount: number;
  currency: string;
  status: string;
  escrowPaymentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TransactionRecord = {
  id: string;
  amount: number;
  type: string;
  description?: string;
  dealId?: string;
  payoutRequestId?: string;
  createdAt: Date;
};

type PayoutRequestRecord = {
  id: string;
  amount: number;
  userId: string;
  status: string;
  fee: number;
  createdAt: Date;
  updatedAt: Date;
};

type DisputeRecord = {
  id: string;
  dealId: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  resolution?: string | null;
  resolvedAt?: Date | null;
  resolvedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectInviteRecord = {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  message?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function containsInsensitive(source: string, query: string): boolean {
  return source.toLowerCase().includes(query.toLowerCase());
}

export class FakePrismaService {
  private counter = 1;

  private users: UserRecord[] = [];
  private profiles: ProfileRecord[] = [];
  private wallets: WalletRecord[] = [];
  private projects: ProjectRecord[] = [];
  private proposals: ProposalRecord[] = [];
  private deals: DealRecord[] = [];
  private transactions: TransactionRecord[] = [];
  private payoutRequests: PayoutRequestRecord[] = [];
  private disputes: DisputeRecord[] = [];
  private projectInvites: ProjectInviteRecord[] = [];

  private nextId(prefix: string) {
    const id = `${prefix}_${this.counter}`;
    this.counter += 1;
    return id;
  }

  private mapUserSelect(user: UserRecord, select: any) {
    if (!select) {
      return user;
    }

    const result: Record<string, any> = {};

    for (const key of Object.keys(select)) {
      if (!select[key]) continue;

      if (key === 'profile') {
        const profile =
          this.profiles.find((item) => item.userId === user.id) || null;
        result.profile = profile;
        continue;
      }

      if (key === 'wallet') {
        const wallet =
          this.wallets.find((item) => item.userId === user.id) || null;
        result.wallet = wallet;
        continue;
      }

      result[key] = (user as any)[key];
    }

    return result;
  }

  seedDeal(
    data: Omit<DealRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): DealRecord {
    const now = new Date();
    const deal: DealRecord = {
      id: this.nextId('deal'),
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    this.deals.push(deal);
    return deal;
  }

  user = {
    findUnique: async ({ where, select }: any) => {
      let target: UserRecord | null = null;

      if (where?.id) {
        target = this.users.find((user) => user.id === where.id) || null;
      }

      if (!target && where?.email) {
        target = this.users.find((user) => user.email === where.email) || null;
      }

      if (!target) {
        return null;
      }

      return this.mapUserSelect(target, select);
    },

    findMany: async ({ where, select, orderBy }: any = {}) => {
      let result = [...this.users];

      if (where?.role) {
        result = result.filter((user) => user.role === where.role);
      }

      if (orderBy?.createdAt === 'desc') {
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return result.map((user) => this.mapUserSelect(user, select));
    },

    create: async ({ data }: any) => {
      const now = new Date();
      const created: UserRecord = {
        id: this.nextId('user'),
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'freelancer',
        plan: data.plan || 'free',
        boostedUntil: data.boostedUntil ?? null,
        avatar: data.avatar || null,
        hashedRefreshToken: null,
        stripeCustomerId: null,
        createdAt: now,
        updatedAt: now,
      };

      this.users.push(created);

      if (data.wallet?.create) {
        this.wallets.push({
          id: this.nextId('wallet'),
          userId: created.id,
          balance: data.wallet.create.balance ?? 0,
          pending: data.wallet.create.pending ?? 0,
          currency: data.wallet.create.currency ?? 'USD',
          createdAt: now,
          updatedAt: now,
        });
      }

      if (data.profile?.create) {
        this.profiles.push({
          id: this.nextId('profile'),
          userId: created.id,
          bio: data.profile.create.bio ?? null,
          avatar: data.profile.create.avatar ?? null,
          createdAt: now,
          updatedAt: now,
        });
      }

      return created;
    },

    update: async ({ where, data }: any) => {
      const target = this.users.find((user) => user.id === where.id);
      if (!target) throw new Error('User not found');

      Object.assign(target, data, { updatedAt: new Date() });
      return target;
    },
  } as any;

  profile = {
    upsert: async ({ where, update, create }: any) => {
      const existing = this.profiles.find(
        (profile) => profile.userId === where.userId,
      );
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }

      const now = new Date();
      const created: ProfileRecord = {
        id: this.nextId('profile'),
        userId: create.userId,
        bio: create.bio ?? null,
        avatar: create.avatar ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.profiles.push(created);
      return created;
    },
  } as any;

  wallet = {
    findUnique: async ({ where }: any) => {
      if (where.userId) {
        return (
          this.wallets.find((wallet) => wallet.userId === where.userId) || null
        );
      }
      return null;
    },

    upsert: async ({ where, create, update }: any) => {
      const existing = this.wallets.find(
        (wallet) => wallet.userId === where.userId,
      );
      if (existing) {
        Object.assign(existing, update || {}, { updatedAt: new Date() });
        return existing;
      }

      const now = new Date();
      const createdWallet: WalletRecord = {
        id: this.nextId('wallet'),
        userId: create.userId,
        balance: create.balance ?? 0,
        pending: create.pending ?? 0,
        currency: create.currency ?? 'USD',
        createdAt: now,
        updatedAt: now,
      };

      this.wallets.push(createdWallet);
      return createdWallet;
    },

    update: async ({ where, data }: any) => {
      const existing = this.wallets.find(
        (wallet) => wallet.userId === where.userId,
      );
      if (!existing) throw new Error('Wallet not found');

      if (data.balance?.increment !== undefined) {
        existing.balance += data.balance.increment;
      }

      if (data.balance?.decrement !== undefined) {
        existing.balance -= data.balance.decrement;
      }

      if (data.pending?.increment !== undefined) {
        existing.pending += data.pending.increment;
      }

      if (data.pending?.decrement !== undefined) {
        existing.pending -= data.pending.decrement;
      }

      const directData = { ...data };
      delete directData.balance;
      delete directData.pending;

      Object.assign(existing, directData, { updatedAt: new Date() });
      return existing;
    },
  } as any;

  project = {
    create: async ({ data }: any) => {
      const now = new Date();
      const created: ProjectRecord = {
        id: this.nextId('project'),
        title: data.title,
        description: data.description,
        budget: data.budget,
        skills: data.skills || [],
        maxProposals: data.maxProposals ?? null,
        userId: data.userId,
        createdAt: now,
        updatedAt: now,
      };

      this.projects.push(created);
      return created;
    },

    findUnique: async ({ where }: any) => {
      return this.projects.find((project) => project.id === where.id) || null;
    },

    findMany: async ({ where, include, orderBy }: any) => {
      let result = [...this.projects];

      if (where?.skills?.hasSome?.length) {
        const requestedSkills: string[] = where.skills.hasSome;
        result = result.filter((project) =>
          project.skills.some((skill) => requestedSkills.includes(skill)),
        );
      }

      if (where?.budget?.gte !== undefined) {
        result = result.filter((project) => project.budget >= where.budget.gte);
      }

      if (where?.OR?.length) {
        const q =
          where.OR[0]?.title?.contains || where.OR[1]?.description?.contains;
        if (q) {
          result = result.filter(
            (project) =>
              containsInsensitive(project.title, q) ||
              containsInsensitive(project.description, q),
          );
        }
      }

      if (orderBy?.createdAt === 'desc') {
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      if (include?.user) {
        return result.map((project) => {
          const owner = this.users.find((user) => user.id === project.userId);
          return {
            ...project,
            user: owner
              ? {
                  id: owner.id,
                  email: owner.email,
                  firstName: owner.firstName,
                  lastName: owner.lastName,
                  avatar: owner.avatar,
                  plan: owner.plan,
                }
              : null,
          };
        });
      }

      return result;
    },
  } as any;

  projectInvite = {
    count: async ({ where }: any = {}) => {
      return this.projectInvites.filter((invite) => {
        if (where?.projectId && invite.projectId !== where.projectId) {
          return false;
        }

        if (where?.clientId && invite.clientId !== where.clientId) {
          return false;
        }

        if (where?.freelancerId && invite.freelancerId !== where.freelancerId) {
          return false;
        }

        return true;
      }).length;
    },

    findUnique: async ({ where }: any) => {
      if (where?.id) {
        return (
          this.projectInvites.find((invite) => invite.id === where.id) || null
        );
      }

      if (where?.projectId_freelancerId) {
        const target = where.projectId_freelancerId;
        return (
          this.projectInvites.find(
            (invite) =>
              invite.projectId === target.projectId &&
              invite.freelancerId === target.freelancerId,
          ) || null
        );
      }

      return null;
    },

    findMany: async ({ where, include, orderBy }: any = {}) => {
      let result = [...this.projectInvites];

      if (where?.projectId) {
        result = result.filter(
          (invite) => invite.projectId === where.projectId,
        );
      }

      if (where?.clientId) {
        result = result.filter((invite) => invite.clientId === where.clientId);
      }

      if (where?.freelancerId) {
        result = result.filter(
          (invite) => invite.freelancerId === where.freelancerId,
        );
      }

      if (orderBy?.createdAt === 'desc') {
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      if (include?.freelancer) {
        return result.map((invite) => {
          const freelancer =
            this.users.find((user) => user.id === invite.freelancerId) || null;

          if (!freelancer) {
            return {
              ...invite,
              freelancer: null,
            };
          }

          return {
            ...invite,
            freelancer: {
              id: freelancer.id,
              email: freelancer.email,
              firstName: freelancer.firstName,
              lastName: freelancer.lastName,
              avatar: freelancer.avatar,
              boostedUntil: freelancer.boostedUntil,
            },
          };
        });
      }

      return result;
    },

    create: async ({ data, include }: any) => {
      const now = new Date();
      const created: ProjectInviteRecord = {
        id: this.nextId('invite'),
        projectId: data.projectId,
        clientId: data.clientId,
        freelancerId: data.freelancerId,
        message: data.message ?? null,
        status: data.status || 'sent',
        createdAt: now,
        updatedAt: now,
      };

      this.projectInvites.push(created);

      if (include?.freelancer) {
        const freelancer =
          this.users.find((user) => user.id === created.freelancerId) || null;

        return {
          ...created,
          freelancer: freelancer
            ? {
                id: freelancer.id,
                email: freelancer.email,
                firstName: freelancer.firstName,
                lastName: freelancer.lastName,
                avatar: freelancer.avatar,
                boostedUntil: freelancer.boostedUntil,
              }
            : null,
        };
      }

      return created;
    },
  } as any;

  proposal = {
    count: async ({ where }: any) => {
      return this.proposals.filter((proposal) => {
        if (where.projectId && proposal.projectId !== where.projectId)
          return false;
        if (where.senderId && proposal.senderId !== where.senderId)
          return false;
        return true;
      }).length;
    },

    create: async ({ data }: any) => {
      const now = new Date();
      const created: ProposalRecord = {
        id: this.nextId('proposal'),
        content: data.content,
        price: data.price,
        projectId: data.projectId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      this.proposals.push(created);
      return created;
    },

    findUnique: async ({ where }: any) => {
      const proposal =
        this.proposals.find((item) => item.id === where.id) || null;
      if (!proposal) return null;

      const project =
        this.projects.find((item) => item.id === proposal.projectId) || null;

      return {
        ...proposal,
        project,
      };
    },

    findMany: async ({ where, include, orderBy }: any) => {
      let result = this.proposals.filter(
        (proposal) => proposal.projectId === where.projectId,
      );

      if (orderBy?.createdAt === 'desc') {
        result = result.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      }

      if (include?.sender) {
        return result.map((proposal) => {
          const sender = this.users.find(
            (user) => user.id === proposal.senderId,
          );
          return {
            ...proposal,
            sender: sender
              ? {
                  id: sender.id,
                  email: sender.email,
                  firstName: sender.firstName,
                  lastName: sender.lastName,
                  avatar: sender.avatar,
                  boostedUntil: sender.boostedUntil,
                }
              : null,
          };
        });
      }

      return result;
    },
  } as any;

  deal = {
    findUnique: async ({ where }: any) => {
      return this.deals.find((deal) => deal.id === where.id) || null;
    },

    findMany: async ({ where, include, orderBy }: any = {}) => {
      let result = [...this.deals];

      if (where?.status) {
        result = result.filter((deal) => deal.status === where.status);
      }

      if (where?.receiverId) {
        result = result.filter((deal) => deal.receiverId === where.receiverId);
      }

      if (where?.senderId) {
        result = result.filter((deal) => deal.senderId === where.senderId);
      }

      if (orderBy?.createdAt === 'desc') {
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      if (include?.project) {
        return result.map((deal) => {
          const project =
            this.projects.find((item) => item.id === deal.projectId) || null;

          if (!include.project.select || !project) {
            return {
              ...deal,
              project,
            };
          }

          const selectedProject: Record<string, any> = {};

          for (const key of Object.keys(include.project.select)) {
            if (!include.project.select[key]) continue;
            selectedProject[key] = (project as any)[key];
          }

          return {
            ...deal,
            project: selectedProject,
          };
        });
      }

      return result;
    },

    create: async ({ data }: any) => {
      const now = new Date();
      const created: DealRecord = {
        id: this.nextId('deal'),
        projectId: data.projectId,
        proposalId: data.proposalId ?? null,
        senderId: data.senderId,
        receiverId: data.receiverId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        escrowPaymentId: data.escrowPaymentId ?? null,
        createdAt: now,
        updatedAt: now,
      };

      this.deals.push(created);
      return created;
    },

    update: async ({ where, data }: any) => {
      const deal = this.deals.find((item) => item.id === where.id);
      if (!deal) throw new Error('Deal not found');

      Object.assign(deal, data, { updatedAt: new Date() });
      return deal;
    },
  } as any;

  payoutRequest = {
    create: async ({ data }: any) => {
      const now = new Date();
      const created: PayoutRequestRecord = {
        id: this.nextId('payout'),
        amount: data.amount,
        userId: data.userId,
        status: data.status,
        fee: data.fee,
        createdAt: now,
        updatedAt: now,
      };

      this.payoutRequests.push(created);
      return created;
    },

    findUnique: async ({ where }: any) => {
      return this.payoutRequests.find((item) => item.id === where.id) || null;
    },

    update: async ({ where, data }: any) => {
      const payout = this.payoutRequests.find((item) => item.id === where.id);
      if (!payout) throw new Error('Payout request not found');

      Object.assign(payout, data, { updatedAt: new Date() });
      return payout;
    },
  } as any;

  transaction = {
    create: async ({ data }: any) => {
      const created: TransactionRecord = {
        id: this.nextId('tx'),
        amount: data.amount,
        type: data.type,
        description: data.description,
        dealId: data.dealId,
        payoutRequestId: data.payoutRequestId,
        createdAt: new Date(),
      };

      this.transactions.push(created);
      return created;
    },
  } as any;

  dispute = {
    findUnique: async ({ where }: any) => {
      const found = this.disputes.find((item) => item.id === where.id) || null;
      if (!found) return null;

      const deal = this.deals.find((item) => item.id === found.dealId) || null;
      return { ...found, deal };
    },

    create: async ({ data }: any) => {
      const now = new Date();
      const created: DisputeRecord = {
        id: this.nextId('dispute'),
        dealId: data.dealId,
        userId: data.userId,
        title: data.title,
        description: data.description,
        status: data.status,
        resolution: data.resolution ?? null,
        resolvedAt: data.resolvedAt ?? null,
        resolvedById: data.resolvedById ?? null,
        createdAt: now,
        updatedAt: now,
      };

      this.disputes.push(created);
      return created;
    },

    update: async ({ where, data }: any) => {
      const dispute = this.disputes.find((item) => item.id === where.id);
      if (!dispute) throw new Error('Dispute not found');

      Object.assign(dispute, data, { updatedAt: new Date() });
      return dispute;
    },
  } as any;

  message = {
    create: async () => {
      throw new Error('Not implemented in tests');
    },
    findMany: async () => {
      return [];
    },
  } as any;

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async $connect() {
    return;
  }

  async $disconnect() {
    return;
  }
}
