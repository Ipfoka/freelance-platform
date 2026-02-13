import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateProjectInviteDto } from './projects/dto/create-project-invite.dto';

type CreateProjectPayload = {
  title: string;
  description: string;
  budget: number;
  skills?: string[];
  maxProposals?: number;
  automationType?:
    | 'telegram_bot'
    | 'telegram_mini_app'
    | 'automation_pipeline'
    | 'ai_assistant'
    | 'integration';
  botStage?: string;
  integrations?: string[];
  mainGoal?: string;
  deadlineDays?: number;
  supportNeeded?: boolean;
};

type PlanName = 'free' | 'pro' | 'business';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private sanitizeSkill(value: string): string {
    return value.trim().toLowerCase();
  }

  private toPositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private normalizePlan(plan?: string | null): PlanName {
    if (plan === 'pro') return 'pro';
    if (plan === 'business') return 'business';
    return 'free';
  }

  private getInviteLimitByPlan(plan: PlanName): number {
    if (plan === 'pro') {
      return this.toPositiveInt(process.env.INVITE_LIMIT_PRO, 10);
    }

    if (plan === 'business') {
      return this.toPositiveInt(process.env.INVITE_LIMIT_BUSINESS, 25);
    }

    return this.toPositiveInt(process.env.INVITE_LIMIT_FREE, 3);
  }

  private buildInviteQuota(plan: PlanName, used: number) {
    const limit = this.getInviteLimitByPlan(plan);
    return {
      plan,
      limit,
      used,
      remaining: Math.max(limit - used, 0),
    };
  }

  private buildAutoTags(projectData: CreateProjectPayload): string[] {
    const manualSkills = (projectData.skills || []).map((item) =>
      this.sanitizeSkill(item),
    );

    const text = [
      projectData.title,
      projectData.description,
      projectData.mainGoal || '',
      (projectData.integrations || []).join(' '),
      projectData.botStage || '',
      projectData.automationType || '',
    ]
      .join(' ')
      .toLowerCase();

    const tagMatchers: Array<{ patterns: string[]; tag: string }> = [
      { patterns: ['telegram', 'tg', 'bot'], tag: 'telegram' },
      {
        patterns: ['mini app', 'miniapp', 'mini-app'],
        tag: 'telegram-mini-app',
      },
      { patterns: ['ai', 'gpt', 'openai', 'llm'], tag: 'ai-automation' },
      { patterns: ['crm', 'bitrix', 'amo'], tag: 'crm' },
      { patterns: ['stripe', 'payment', 'pay'], tag: 'payments' },
      { patterns: ['webhook'], tag: 'webhooks' },
      { patterns: ['google sheets', 'sheets'], tag: 'google-sheets' },
      { patterns: ['n8n', 'make.com', 'zapier'], tag: 'workflow-automation' },
      { patterns: ['python'], tag: 'python' },
      { patterns: ['node', 'nestjs', 'typescript'], tag: 'nodejs' },
      { patterns: ['php', 'laravel'], tag: 'php' },
    ];

    const autoTags: string[] = [];

    for (const { patterns, tag } of tagMatchers) {
      if (patterns.some((pattern) => text.includes(pattern))) {
        autoTags.push(tag);
      }
    }

    if (projectData.automationType) {
      autoTags.push(this.sanitizeSkill(projectData.automationType));
    }

    for (const integration of projectData.integrations || []) {
      autoTags.push(this.sanitizeSkill(integration));
    }

    const unique = Array.from(new Set([...manualSkills, ...autoTags])).filter(
      Boolean,
    );
    return unique.slice(0, 20);
  }

  private buildTgBrief(projectData: CreateProjectPayload): string {
    const lines: string[] = [];

    if (projectData.automationType) {
      lines.push(`Type: ${projectData.automationType}`);
    }

    if (projectData.botStage) {
      lines.push(`Stage: ${projectData.botStage}`);
    }

    if (projectData.mainGoal) {
      lines.push(`Main goal: ${projectData.mainGoal}`);
    }

    if (projectData.integrations && projectData.integrations.length > 0) {
      lines.push(`Integrations: ${projectData.integrations.join(', ')}`);
    }

    if (projectData.deadlineDays) {
      lines.push(`Deadline target: ${projectData.deadlineDays} days`);
    }

    if (projectData.supportNeeded !== undefined) {
      lines.push(
        `Post-launch support: ${projectData.supportNeeded ? 'required' : 'not required'}`,
      );
    }

    if (lines.length === 0) {
      return '';
    }

    return ['Automation brief:', ...lines.map((line) => `- ${line}`)].join(
      '\n',
    );
  }

  async createProject(userId: string, projectData: CreateProjectPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'client') {
      throw new ForbiddenException('Only clients can create projects');
    }

    const autoTags = this.buildAutoTags(projectData);
    const brief = this.buildTgBrief(projectData);
    const finalDescription = brief
      ? `${projectData.description.trim()}\n\n${brief}`
      : projectData.description.trim();

    return this.prisma.project.create({
      data: {
        title: projectData.title,
        description: finalDescription,
        budget: projectData.budget,
        maxProposals: projectData.maxProposals,
        skills: autoTags,
        userId,
      },
    });
  }

  async getProjects(filter: {
    skills?: string[];
    budget?: string;
    q?: string;
  }) {
    const { skills, budget, q } = filter;
    const whereClause: any = {};

    if (skills && skills.length > 0) {
      whereClause.skills = {
        hasSome: skills.map((item) => this.sanitizeSkill(item)),
      };
    }

    if (budget) {
      const budgetNum = parseFloat(budget);
      if (!Number.isNaN(budgetNum)) {
        whereClause.budget = {
          gte: budgetNum,
        };
      }
    }

    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.project.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createProposal(
    userId: string,
    projectId: string,
    proposalData: { content: string; price: number },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'freelancer') {
      throw new ForbiddenException('Only freelancers can submit proposals');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingProposal = await this.prisma.proposal.count({
      where: {
        projectId,
        senderId: userId,
      },
    });

    if (existingProposal > 0) {
      throw new ConflictException(
        'You have already submitted a proposal for this project',
      );
    }

    const maxProposals = project.maxProposals || 100;
    const currentProposals = await this.prisma.proposal.count({
      where: {
        projectId,
      },
    });

    if (currentProposals >= maxProposals) {
      throw new BadRequestException(
        'Maximum number of proposals reached for this project',
      );
    }

    // Proposals stay free by design. Monetization comes from commission and boosts.
    return this.prisma.proposal.create({
      data: {
        ...proposalData,
        projectId,
        senderId: userId,
        receiverId: project.userId,
      },
    });
  }

  async getProjectProposals(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.proposal.findMany({
      where: {
        projectId,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            boostedUntil: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTopExecutors(userId: string, projectId: string, limit = 5) {
    const [project, client] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          plan: true,
        },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!client) {
      throw new NotFoundException('User not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), 20)
      : 5;

    const [freelancers, releasedDeals, projectInvites] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'freelancer' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          boostedUntil: true,
        },
      }),
      this.prisma.deal.findMany({
        where: { status: 'released' },
        include: {
          project: {
            select: {
              skills: true,
            },
          },
        },
      }),
      this.prisma.projectInvite.findMany({
        where: { projectId },
      }),
    ]);

    const plan = this.normalizePlan(client.plan);
    const inviteQuota = this.buildInviteQuota(plan, projectInvites.length);
    const invitedFreelancers = new Set(
      projectInvites.map((invite) => invite.freelancerId),
    );

    const projectSkills = new Set(
      (project.skills || []).map((skill) => this.sanitizeSkill(skill)),
    );

    const dealsByFreelancer = new Map<string, typeof releasedDeals>();
    for (const deal of releasedDeals) {
      const bucket = dealsByFreelancer.get(deal.receiverId) || [];
      bucket.push(deal);
      dealsByFreelancer.set(deal.receiverId, bucket);
    }

    const now = new Date();

    const ranked = freelancers
      .map((freelancer) => {
        const freelancerDeals = dealsByFreelancer.get(freelancer.id) || [];
        const completedDeals = freelancerDeals.length;

        const totalAmount = freelancerDeals.reduce(
          (sum, deal) => sum + deal.amount,
          0,
        );

        const averageAmount =
          completedDeals > 0 ? totalAmount / completedDeals : 0;

        let matchedSkillDeals = 0;

        for (const deal of freelancerDeals) {
          const dealSkills = (deal.project?.skills || []).map((item) =>
            this.sanitizeSkill(item),
          );

          if (dealSkills.some((skill) => projectSkills.has(skill))) {
            matchedSkillDeals += 1;
          }
        }

        const skillScore =
          completedDeals > 0
            ? (matchedSkillDeals / completedDeals) * 35
            : projectSkills.size === 0
              ? 10
              : 0;

        const completedScore = Math.min(completedDeals / 8, 1) * 45;

        const budgetBaseline = project.budget > 0 ? project.budget : 1;
        const budgetDelta =
          averageAmount > 0
            ? Math.abs(averageAmount - budgetBaseline) / budgetBaseline
            : 1;
        const budgetFit = averageAmount > 0 ? Math.max(0, 1 - budgetDelta) : 0;
        const budgetScore = budgetFit * 20;

        const isBoosted = Boolean(
          freelancer.boostedUntil && freelancer.boostedUntil > now,
        );
        const boostScore = isBoosted ? 15 : 0;

        const score =
          Math.round(
            (completedScore + skillScore + budgetScore + boostScore) * 10,
          ) / 10;

        return {
          id: freelancer.id,
          email: freelancer.email,
          firstName: freelancer.firstName,
          lastName: freelancer.lastName,
          avatar: freelancer.avatar,
          boostedUntil: freelancer.boostedUntil,
          isBoosted,
          alreadyInvited: invitedFreelancers.has(freelancer.id),
          score,
          stats: {
            completedDeals,
            matchedSkillDeals,
            averageAmount: Math.round(averageAmount * 100) / 100,
          },
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score || b.stats.completedDeals - a.stats.completedDeals,
      )
      .slice(0, safeLimit);

    return {
      projectId: project.id,
      totalCandidates: freelancers.length,
      inviteQuota,
      recommended: ranked,
    };
  }

  async getProjectInvites(userId: string, projectId: string) {
    const [project, client] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, plan: true },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!client) {
      throw new NotFoundException('User not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const invites = await this.prisma.projectInvite.findMany({
      where: { projectId },
      include: {
        freelancer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            boostedUntil: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const plan = this.normalizePlan(client.plan);

    return {
      projectId,
      inviteQuota: this.buildInviteQuota(plan, invites.length),
      invites,
    };
  }

  async inviteFreelancer(
    userId: string,
    projectId: string,
    inviteData: CreateProjectInviteDto,
  ) {
    const [project, client, freelancer] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          plan: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: inviteData.freelancerId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          boostedUntil: true,
        },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!client) {
      throw new NotFoundException('User not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!freelancer || freelancer.role !== 'freelancer') {
      throw new NotFoundException('Freelancer not found');
    }

    const existingInvite = await this.prisma.projectInvite.findUnique({
      where: {
        projectId_freelancerId: {
          projectId,
          freelancerId: inviteData.freelancerId,
        },
      },
    });

    if (existingInvite) {
      throw new ConflictException('Freelancer already invited');
    }

    const currentInviteCount = await this.prisma.projectInvite.count({
      where: { projectId },
    });

    const plan = this.normalizePlan(client.plan);
    const inviteLimit = this.getInviteLimitByPlan(plan);

    if (currentInviteCount >= inviteLimit) {
      throw new BadRequestException(
        `Invite limit reached for ${plan} plan (${inviteLimit} invites per project)`,
      );
    }

    const invite = await this.prisma.projectInvite.create({
      data: {
        projectId,
        clientId: userId,
        freelancerId: inviteData.freelancerId,
        message: inviteData.message,
      },
      include: {
        freelancer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            boostedUntil: true,
          },
        },
      },
    });

    return {
      invite,
      inviteQuota: this.buildInviteQuota(plan, currentInviteCount + 1),
    };
  }
}
