import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthModule } from '../src/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ProjectsModule } from '../src/projects.module';
import { DealsModule } from '../src/deals.module';
import { PayoutsModule } from '../src/payouts.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakePrismaService } from './fake-prisma';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    DealsModule,
    PayoutsModule,
  ],
})
class TestApiModule {}

describe('Critical flow e2e', () => {
  let app: INestApplication | undefined;
  let prisma: FakePrismaService;

  let clientAuth: any;
  let freelancerAuth: any;
  let freelancer2Auth: any;
  let projectId: string;
  let proposalId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_access_secret_123';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_123';
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
    process.env.AWS_S3_BUCKET_NAME = 'bucket-for-tests';
    process.env.AWS_ACCESS_KEY_ID = 'key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.AWS_REGION = 'us-east-1';
    process.env.RATE_LIMIT_TTL = '60';
    process.env.RATE_LIMIT_LIMIT = '500';
    process.env.PLATFORM_COMMISSION_RATE = '0.1';
    process.env.PROFILE_BOOST_PRICE = '15';
    process.env.PROFILE_BOOST_DAYS = '14';
    process.env.INVITE_LIMIT_FREE = '1';
    process.env.INVITE_LIMIT_PRO = '5';
    process.env.INVITE_LIMIT_BUSINESS = '10';
    delete process.env.REDIS_URL;

    prisma = new FakePrismaService();

    const moduleRef = await Test.createTestingModule({
      imports: [TestApiModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('registers client and freelancers', async () => {
    const client = await request(app!.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'client@example.com',
        password: 'StrongPass123',
        firstName: 'Client',
        lastName: 'User',
        role: 'client',
      });

    expect(client.status).toBe(201);
    expect(client.body.user.role).toBe('client');
    expect(client.body.access_token).toBeDefined();
    expect(client.body.refresh_token).toBeDefined();
    clientAuth = client.body;

    const freelancer = await request(app!.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'freelancer@example.com',
        password: 'StrongPass123',
        firstName: 'Free',
        lastName: 'Lancer',
        role: 'freelancer',
      });

    expect(freelancer.status).toBe(201);
    expect(freelancer.body.user.role).toBe('freelancer');
    freelancerAuth = freelancer.body;

    const freelancer2 = await request(app!.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'freelancer2@example.com',
        password: 'StrongPass123',
        firstName: 'Second',
        lastName: 'Freelancer',
        role: 'freelancer',
      });

    expect(freelancer2.status).toBe(201);
    expect(freelancer2.body.user.role).toBe('freelancer');
    freelancer2Auth = freelancer2.body;
  });

  it('refreshes token successfully', async () => {
    const response = await request(app!.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: clientAuth.refresh_token,
      });

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBeDefined();
    expect(response.body.refresh_token).toBeDefined();
  });

  it('creates project for client and blocks freelancer from creating', async () => {
    const createByClient = await request(app!.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${clientAuth.access_token}`)
      .send({
        title: 'Landing page redesign',
        description: 'Need a responsive marketing page with CMS integration',
        budget: 500,
        skills: ['react', 'design'],
        maxProposals: 5,
        automationType: 'telegram_bot',
        mainGoal: 'Build Telegram sales bot with CRM sync',
        integrations: ['telegram', 'amoCRM', 'stripe'],
        supportNeeded: true,
        deadlineDays: 10,
      });

    expect(createByClient.status).toBe(201);
    expect(createByClient.body.title).toBe('Landing page redesign');
    projectId = createByClient.body.id;

    const createByFreelancer = await request(app!.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`)
      .send({
        title: 'Should fail',
        description: 'Should fail',
        budget: 100,
      });

    expect(createByFreelancer.status).toBe(403);
  });

  it('submits proposal and client can read proposals', async () => {
    const proposalResponse = await request(app!.getHttpServer())
      .post(`/api/projects/${projectId}/proposals`)
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`)
      .send({
        content: 'I can deliver this in 4 days with full QA.',
        price: 400,
      });

    expect(proposalResponse.status).toBe(201);
    expect(proposalResponse.body.projectId).toBe(projectId);
    proposalId = proposalResponse.body.id;

    const proposalsForClient = await request(app!.getHttpServer())
      .get(`/api/projects/${projectId}/proposals`)
      .set('Authorization', `Bearer ${clientAuth.access_token}`);

    expect(proposalsForClient.status).toBe(200);
    expect(proposalsForClient.body).toHaveLength(1);
    expect(proposalsForClient.body[0].id).toBe(proposalId);
  });

  it('confirms escrowed deal and credits freelancer wallet minus commission', async () => {
    const seededDeal = prisma.seedDeal({
      projectId,
      proposalId,
      senderId: clientAuth.user.id,
      receiverId: freelancerAuth.user.id,
      amount: 400,
      currency: 'USD',
      status: 'escrowed',
      escrowPaymentId: 'pi_mock_123',
    });

    const confirmResponse = await request(app!.getHttpServer())
      .post(`/api/deals/${seededDeal.id}/confirm`)
      .set('Authorization', `Bearer ${clientAuth.access_token}`)
      .send({});

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.status).toBe('released');
    expect(confirmResponse.body.platformFee).toBe(40);
    expect(confirmResponse.body.freelancerAmount).toBe(360);

    const freelancerProfile = await request(app!.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`);

    expect(freelancerProfile.status).toBe(200);
    expect(freelancerProfile.body.wallet.balance).toBe(360);
  });

  it('returns top executors and invite quota for project owner', async () => {
    const recommendations = await request(app!.getHttpServer())
      .get(`/api/projects/${projectId}/top-executors`)
      .set('Authorization', `Bearer ${clientAuth.access_token}`);

    expect(recommendations.status).toBe(200);
    expect(recommendations.body.projectId).toBe(projectId);
    expect(recommendations.body.totalCandidates).toBe(2);
    expect(recommendations.body.recommended).toHaveLength(2);
    expect(recommendations.body.recommended[0].id).toBe(freelancerAuth.user.id);
    expect(recommendations.body.recommended[0].stats.completedDeals).toBe(1);
    expect(recommendations.body.inviteQuota.limit).toBe(1);
    expect(recommendations.body.inviteQuota.used).toBe(0);
  });

  it('allows one-click invite and enforces plan invite limit', async () => {
    const firstInvite = await request(app!.getHttpServer())
      .post(`/api/projects/${projectId}/invites`)
      .set('Authorization', `Bearer ${clientAuth.access_token}`)
      .send({
        freelancerId: freelancerAuth.user.id,
      });

    expect(firstInvite.status).toBe(201);
    expect(firstInvite.body.invite.freelancerId).toBe(freelancerAuth.user.id);
    expect(firstInvite.body.inviteQuota.used).toBe(1);
    expect(firstInvite.body.inviteQuota.remaining).toBe(0);

    const secondInvite = await request(app!.getHttpServer())
      .post(`/api/projects/${projectId}/invites`)
      .set('Authorization', `Bearer ${clientAuth.access_token}`)
      .send({
        freelancerId: freelancer2Auth.user.id,
      });

    expect(secondInvite.status).toBe(400);
  });

  it('allows freelancer to buy profile boost', async () => {
    const boostOffer = await request(app!.getHttpServer())
      .get('/api/users/me/boost-offer')
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`);

    expect(boostOffer.status).toBe(200);
    expect(boostOffer.body.price).toBe(15);
    expect(boostOffer.body.days).toBe(14);

    const buyBoost = await request(app!.getHttpServer())
      .post('/api/users/me/boost-profile')
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`)
      .send({});

    expect(buyBoost.status).toBe(200);
    expect(buyBoost.body.chargedAmount).toBe(15);
    expect(buyBoost.body.boostedUntil).toBeDefined();

    const freelancerProfile = await request(app!.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`);

    expect(freelancerProfile.status).toBe(200);
    expect(freelancerProfile.body.wallet.balance).toBe(345);
    expect(freelancerProfile.body.boostedUntil).toBeDefined();
  });

  it('creates payout request and decreases wallet balance', async () => {
    const payout = await request(app!.getHttpServer())
      .post('/api/payouts')
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`)
      .send({ amount: 100 });

    expect(payout.status).toBe(201);
    expect(payout.body.status).toBe('pending');
    expect(payout.body.fee).toBe(2.5);

    const profileAfterPayout = await request(app!.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${freelancerAuth.access_token}`);

    expect(profileAfterPayout.status).toBe(200);
    expect(profileAfterPayout.body.wallet.balance).toBe(245);
  });
});
