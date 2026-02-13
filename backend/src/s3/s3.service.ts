import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async getUploadUrl(key: string, fileType: string, expiresIn = 900) {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new InternalServerErrorException(
        'AWS_S3_BUCKET_NAME is not configured',
      );
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      url: signedUrl,
      key,
      bucket: bucketName,
      expiresIn,
    };
  }

  async getAvatarUploadUrl(userId: string, fileName: string, fileType: string) {
    const key = `avatars/${userId}/${Date.now()}-${fileName}`;
    return this.getUploadUrl(key, fileType);
  }
}
