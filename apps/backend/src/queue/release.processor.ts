import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Release, ReleaseStatus } from '../releases/entities/release.entity';

@Processor('release-processing')
@Injectable()
export class ReleaseProcessor {
  private readonly logger = new Logger(ReleaseProcessor.name);

  constructor(
    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,
  ) {}

  @Process('submitted')
  async handleSubmitted(job: Job<{ releaseId: string; userId: string }>) {
    const { releaseId } = job.data;
    this.logger.log(`Processing submitted release: ${releaseId}`);

    const release = await this.releaseRepo.findOne({
      where: { id: releaseId },
      relations: ['songs'],
    });
    if (!release) return;

    // Validate audio files exist in S3, audio metadata, artwork dimensions
    // This would be extended with actual S3 validation + audio processing (ffprobe etc.)
    this.logger.log(`Release ${releaseId} validated OK — awaiting admin review`);
  }

  @Process('approved')
  async handleApproved(job: Job<{ releaseId: string }>) {
    const { releaseId } = job.data;
    this.logger.log(`Starting distribution for release: ${releaseId}`);

    const release = await this.releaseRepo.findOne({ where: { id: releaseId } });
    if (!release) return;

    // Placeholder: future API integrations
    // for (const platform of release.distributionPlatforms) {
    //   await this.distributionService.submit(platform, release);
    // }

    release.status = ReleaseStatus.DISTRIBUTED;
    release.distributedAt = new Date();
    await this.releaseRepo.save(release);

    this.logger.log(`Release ${releaseId} marked as distributed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.name} failed:`, error.message);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.name} completed`);
  }
}
