import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

interface EmailJobData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface WebhookJobData {
  eventType: string;
  payload: any;
  endpoint: string;
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly redisConnection?: Redis;

  private emailQueue?: Queue;
  private pushNotificationQueue?: Queue;
  private webhookQueue?: Queue;

  private emailWorker?: Worker;
  private pushNotificationWorker?: Worker;
  private webhookWorker?: Worker;

  constructor() {
    if (!process.env.REDIS_URL) {
      this.logger.warn(
        'REDIS_URL is not configured. Queue workers are disabled.',
      );
      return;
    }

    this.redisConnection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    this.emailQueue = new Queue('email', { connection: this.redisConnection });
    this.pushNotificationQueue = new Queue('push_notification', {
      connection: this.redisConnection,
    });
    this.webhookQueue = new Queue('webhook', {
      connection: this.redisConnection,
    });

    this.emailWorker = new Worker('email', this.processEmailJob.bind(this), {
      connection: this.redisConnection,
    });
    this.pushNotificationWorker = new Worker(
      'push_notification',
      this.processPushNotificationJob.bind(this),
      { connection: this.redisConnection },
    );
    this.webhookWorker = new Worker(
      'webhook',
      this.processWebhookJob.bind(this),
      {
        connection: this.redisConnection,
      },
    );
  }

  async addEmailJob(data: EmailJobData): Promise<void> {
    if (!this.emailQueue) return;
    await this.emailQueue.add('send-email', data);
  }

  async addPushNotificationJob(data: PushNotificationJobData): Promise<void> {
    if (!this.pushNotificationQueue) return;
    await this.pushNotificationQueue.add('send-push-notification', data);
  }

  async addWebhookJob(data: WebhookJobData): Promise<void> {
    if (!this.webhookQueue) return;
    await this.webhookQueue.add('send-webhook', data);
  }

  async processEmailJob(job: { data: EmailJobData }) {
    const { to, subject } = job.data;
    this.logger.log(`Sending email to: ${to}, subject: ${subject}`);
    return { success: true, to, subject };
  }

  async processPushNotificationJob(job: { data: PushNotificationJobData }) {
    const { userId, title } = job.data;
    this.logger.log(
      `Sending push notification to user: ${userId}, title: ${title}`,
    );
    return { success: true, userId, title };
  }

  async processWebhookJob(job: { data: WebhookJobData }) {
    const { eventType, endpoint } = job.data;
    this.logger.log(`Sending webhook to: ${endpoint}, type: ${eventType}`);
    return { success: true, eventType, endpoint };
  }

  async onModuleDestroy() {
    if (this.emailWorker) await this.emailWorker.close();
    if (this.pushNotificationWorker) await this.pushNotificationWorker.close();
    if (this.webhookWorker) await this.webhookWorker.close();

    if (this.emailQueue) await this.emailQueue.close();
    if (this.pushNotificationQueue) await this.pushNotificationQueue.close();
    if (this.webhookQueue) await this.webhookQueue.close();

    if (this.redisConnection) {
      await this.redisConnection.quit();
    }
  }
}
