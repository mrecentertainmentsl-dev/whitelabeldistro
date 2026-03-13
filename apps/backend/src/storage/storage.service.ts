import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

export interface UploadOptions {
  bucket?: string;
  prefix?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  expiresIn?: number;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  key: string;
  bucket: string;
  expiresAt: Date;
  fields?: Record<string, string>;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.initS3Client();
  }

  private initS3Client(
    accessKeyId?: string,
    secretAccessKey?: string,
    region?: string,
  ) {
    const ak = accessKeyId || this.configService.get('AWS_ACCESS_KEY_ID');
    const sk = secretAccessKey || this.configService.get('AWS_SECRET_ACCESS_KEY');
    const r = region || this.configService.get('AWS_S3_REGION', 'us-east-1');

    this.s3Client = new S3Client({
      region: r,
      credentials: ak && sk ? { accessKeyId: ak, secretAccessKey: sk } : undefined,
    });
  }

  // Reinitialize with custom credentials (from settings)
  reinitialize(accessKeyId: string, secretAccessKey: string, region: string) {
    this.initS3Client(accessKeyId, secretAccessKey, region);
  }

  async generatePresignedUploadUrl(
    filename: string,
    contentType: string,
    options: UploadOptions = {},
  ): Promise<PresignedUploadUrl> {
    const bucket = options.bucket || this.configService.get('AWS_S3_BUCKET');
    const expiresIn = options.expiresIn || 3600;
    const ext = filename.split('.').pop()?.toLowerCase();
    const key = `${options.prefix || 'uploads'}/${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Metadata: options.metadata || {},
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { uploadUrl, key, bucket, expiresAt };
  }

  async generatePresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
    bucket?: string,
  ): Promise<string> {
    const b = bucket || this.configService.get('AWS_S3_BUCKET');
    const command = new GetObjectCommand({ Bucket: b, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    const b = bucket || this.configService.get('AWS_S3_BUCKET');
    try {
      await this.s3Client.send(new DeleteObjectCommand({ Bucket: b, Key: key }));
      this.logger.log(`Deleted S3 object: ${key}`);
    } catch (err) {
      this.logger.error(`Failed to delete S3 object ${key}:`, err);
      throw err;
    }
  }

  async fileExists(key: string, bucket?: string): Promise<boolean> {
    const b = bucket || this.configService.get('AWS_S3_BUCKET');
    try {
      await this.s3Client.send(new HeadObjectCommand({ Bucket: b, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string, bucket?: string, region?: string): string {
    const b = bucket || this.configService.get('AWS_S3_BUCKET');
    const r = region || this.configService.get('AWS_S3_REGION', 'us-east-1');
    return `https://${b}.s3.${r}.amazonaws.com/${key}`;
  }

  validateAudioFile(mimetype: string, originalname: string): void {
    const allowedFormats = ['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];
    const allowedExtensions = ['wav', 'flac'];
    const ext = originalname.split('.').pop()?.toLowerCase();

    if (!allowedFormats.includes(mimetype) && !allowedExtensions.includes(ext || '')) {
      throw new BadRequestException(
        `Invalid audio format. Only WAV and FLAC files are accepted. Received: ${mimetype}`,
      );
    }
  }

  validateArtworkFile(mimetype: string, originalname: string): void {
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    const ext = originalname.split('.').pop()?.toLowerCase();

    if (!allowedFormats.includes(mimetype)) {
      throw new BadRequestException(
        `Invalid image format. Only JPG and PNG are accepted. Received: ${mimetype}`,
      );
    }
  }
}
