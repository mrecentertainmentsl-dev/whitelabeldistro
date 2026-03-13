import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Release, ReleaseStatus, ReleaseType, ParentalAdvisory } from './entities/release.entity';
import { Song } from './entities/song.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export class ArtistCreditDto {
  name: string;
  role: string;
  isniCode?: string;
  spotifyId?: string;
  appleId?: string;
  sequenceNo?: number;
}

export class ContributorCreditDto {
  name: string;
  role: string;
  ipiNumber?: string;
  proAffiliation?: string;
  sequenceNo?: number;
}

export class PublishingShareDto {
  type: 'songwriter' | 'publisher';
  name: string;
  ipiNumber?: string;
  proAffiliation?: string;
  sharePercent: number;
}

export class CreateSongDto {
  id?: string;
  title: string;
  titleVersion?: string;
  artistName?: string;
  trackNumber?: number;
  discNumber?: number;
  isrc?: string;
  isExplicit?: boolean;
  language?: string;
  lyricsLanguage?: string;
  lyrics?: string;
  previewStartSeconds?: number;
  bpm?: number;
  audioUrl?: string;
  audioS3Key?: string;
  audioFormat?: string;
  audioSizeBytes?: number;
  audioBitrate?: number;
  audioSampleRate?: number;
  audioBitDepth?: number;
  durationSeconds?: number;
  artistCredits?: ArtistCreditDto[];
  contributorCredits?: ContributorCreditDto[];
  publishingShares?: PublishingShareDto[];
}

export class CreateReleaseDto {
  title: string;
  type?: string;
  genre?: string;
  subgenre?: string;
  language?: string;
  labelName?: string;
  parentalAdvisory?: string;
  releaseDate?: string;
  originalReleaseDate?: string;
  territories?: string[];
  upc?: string;
  artworkUrl?: string;
  artworkS3Key?: string;
  artworkWidth?: number;
  artworkHeight?: number;
  distributionPlatforms?: string[];
  scheduledReleaseTime?: string;
  submissionNotes?: string;
  artistCredits?: ArtistCreditDto[];
  contributorCredits?: ContributorCreditDto[];
  publishingShares?: PublishingShareDto[];
  songs?: CreateSongDto[];
  // Wizard autosave
  wizardStep?: number;
  wizardDraft?: Record<string, any>;
}

export class UpdateReleaseDto extends CreateReleaseDto {}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ReleasesService {
  private readonly logger = new Logger(ReleasesService.name);

  constructor(
    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,
    @InjectRepository(Song)
    private readonly songRepo: Repository<Song>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    @InjectQueue('releases') private readonly releasesQueue: Queue,
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateReleaseDto): Promise<Release> {
    const release = this.releaseRepo.create({
      userId,
      title:                dto.title,
      type:                 (dto.type as ReleaseType) || ReleaseType.SINGLE,
      genre:                dto.genre,
      subgenre:             dto.subgenre,
      language:             dto.language || 'English',
      labelName:            dto.labelName,
      parentalAdvisory:     (dto.parentalAdvisory as ParentalAdvisory) || ParentalAdvisory.NONE,
      releaseDate:          dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      originalReleaseDate:  dto.originalReleaseDate ? new Date(dto.originalReleaseDate) : undefined,
      territories:          dto.territories || ['worldwide'],
      upc:                  dto.upc,
      artworkUrl:           dto.artworkUrl,
      artworkS3Key:         dto.artworkS3Key,
      artworkWidth:         dto.artworkWidth,
      artworkHeight:        dto.artworkHeight,
      distributionPlatforms: dto.distributionPlatforms || [],
      scheduledReleaseTime: dto.scheduledReleaseTime,
      submissionNotes:      dto.submissionNotes,
      artistCredits:        dto.artistCredits || [],
      contributorCredits:   dto.contributorCredits || [],
      publishingShares:     dto.publishingShares || [],
      wizardStep:           dto.wizardStep || 1,
      wizardDraft:          dto.wizardDraft || {},
      status:               ReleaseStatus.DRAFT,
    });

    const saved = await this.releaseRepo.save(release);

    // Upsert songs
    if (dto.songs?.length) {
      await this.upsertSongs(saved.id, userId, dto.songs);
    }

    return this.findOne(saved.id, userId);
  }

  // ── Find many (user) ────────────────────────────────────────────────────────

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: Release[]; total: number; page: number; limit: number }> {
    const qb = this.releaseRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.songs', 's')
      .where('r.userId = :userId', { userId })
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(LOWER(r.title) LIKE :s OR LOWER(r.labelName) LIKE :s)', { s: `%${search.toLowerCase()}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ── Find one ────────────────────────────────────────────────────────────────

  async findOne(id: string, userId?: string): Promise<Release> {
    const release = await this.releaseRepo.findOne({
      where: { id },
      relations: ['songs', 'user'],
    });
    if (!release) throw new NotFoundException('Release not found');
    if (userId && release.userId !== userId) throw new ForbiddenException('Access denied');
    return release;
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, userId: string, dto: UpdateReleaseDto): Promise<Release> {
    const release = await this.findOne(id, userId);

    if (release.status !== ReleaseStatus.DRAFT && release.status !== ReleaseStatus.REJECTED) {
      // Allow wizard draft saves on pending/approved (just update wizard fields)
      if (dto.wizardDraft) {
        await this.releaseRepo.update(id, { wizardStep: dto.wizardStep, wizardDraft: dto.wizardDraft });
        return this.findOne(id, userId);
      }
      throw new BadRequestException('Only draft or rejected releases can be edited');
    }

    const patch: Partial<Release> = {};
    if (dto.title !== undefined)                patch.title = dto.title;
    if (dto.type !== undefined)                 patch.type = dto.type as ReleaseType;
    if (dto.genre !== undefined)                patch.genre = dto.genre;
    if (dto.subgenre !== undefined)             patch.subgenre = dto.subgenre;
    if (dto.language !== undefined)             patch.language = dto.language;
    if (dto.labelName !== undefined)            patch.labelName = dto.labelName;
    if (dto.parentalAdvisory !== undefined)     patch.parentalAdvisory = dto.parentalAdvisory as ParentalAdvisory;
    if (dto.releaseDate !== undefined)          patch.releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : undefined;
    if (dto.originalReleaseDate !== undefined)  patch.originalReleaseDate = dto.originalReleaseDate ? new Date(dto.originalReleaseDate) : undefined;
    if (dto.territories !== undefined)          patch.territories = dto.territories;
    if (dto.upc !== undefined)                  patch.upc = dto.upc;
    if (dto.artworkUrl !== undefined)           patch.artworkUrl = dto.artworkUrl;
    if (dto.artworkS3Key !== undefined)         patch.artworkS3Key = dto.artworkS3Key;
    if (dto.artworkWidth !== undefined)         patch.artworkWidth = dto.artworkWidth;
    if (dto.artworkHeight !== undefined)        patch.artworkHeight = dto.artworkHeight;
    if (dto.distributionPlatforms !== undefined) patch.distributionPlatforms = dto.distributionPlatforms;
    if (dto.scheduledReleaseTime !== undefined) patch.scheduledReleaseTime = dto.scheduledReleaseTime;
    if (dto.submissionNotes !== undefined)      patch.submissionNotes = dto.submissionNotes;
    if (dto.artistCredits !== undefined)        patch.artistCredits = dto.artistCredits;
    if (dto.contributorCredits !== undefined)   patch.contributorCredits = dto.contributorCredits;
    if (dto.publishingShares !== undefined)     patch.publishingShares = dto.publishingShares;
    if (dto.wizardStep !== undefined)           patch.wizardStep = dto.wizardStep;
    if (dto.wizardDraft !== undefined)          patch.wizardDraft = dto.wizardDraft;

    await this.releaseRepo.update(id, patch);

    if (dto.songs !== undefined) {
      await this.upsertSongs(id, userId, dto.songs);
    }

    return this.findOne(id, userId);
  }

  // ── Upsert songs ────────────────────────────────────────────────────────────

  private async upsertSongs(releaseId: string, userId: string, songs: CreateSongDto[]): Promise<void> {
    // Get existing
    const existing = await this.songRepo.find({ where: { releaseId } });
    const existingIds = new Set(existing.map(s => s.id));
    const incomingIds = new Set(songs.filter(s => s.id).map(s => s.id!));

    // Delete removed songs
    for (const ex of existing) {
      if (!incomingIds.has(ex.id)) {
        await this.songRepo.delete(ex.id);
      }
    }

    // Upsert each song
    for (const dto of songs) {
      const primaryArtist = dto.artistCredits?.find(a => a.role === 'primary_artist');
      const songData: Partial<Song> = {
        releaseId,
        userId,
        title:              dto.title,
        titleVersion:       dto.titleVersion,
        trackNumber:        dto.trackNumber || 1,
        discNumber:         dto.discNumber || 1,
        isrc:               dto.isrc,
        isExplicit:         dto.isExplicit || false,
        language:           dto.language,
        lyricsLanguage:     dto.lyricsLanguage,
        lyrics:             dto.lyrics,
        previewStartSeconds: dto.previewStartSeconds,
        bpm:                dto.bpm,
        audioUrl:           dto.audioUrl,
        audioS3Key:         dto.audioS3Key,
        audioFormat:        dto.audioFormat,
        audioSizeBytes:     dto.audioSizeBytes,
        audioBitrate:       dto.audioBitrate,
        audioSampleRate:    dto.audioSampleRate,
        audioBitDepth:      dto.audioBitDepth,
        durationSeconds:    dto.durationSeconds,
        artistName:         dto.artistName || primaryArtist?.name || '',
        artistCredits:      dto.artistCredits || [],
        contributorCredits: dto.contributorCredits || [],
        publishingShares:   dto.publishingShares || [],
      };

      if (dto.id && existingIds.has(dto.id)) {
        await this.songRepo.update(dto.id, songData);
      } else {
        await this.songRepo.save(this.songRepo.create(songData));
      }
    }
  }

  // ── Submit for review ───────────────────────────────────────────────────────

  async submit(id: string, userId: string, notes?: string): Promise<Release> {
    const release = await this.findOne(id, userId);

    if (release.status !== ReleaseStatus.DRAFT && release.status !== ReleaseStatus.REJECTED) {
      throw new BadRequestException(`Cannot submit a release with status "${release.status}"`);
    }

    // Basic validation
    const errors: string[] = [];
    if (!release.title) errors.push('Missing title');
    if (!release.artworkUrl) errors.push('Missing cover artwork');
    if (!release.songs || release.songs.length === 0) errors.push('No tracks added');
    if (release.songs?.some(s => !s.audioUrl)) errors.push('Some tracks are missing audio files');
    if (release.distributionPlatforms.length === 0) errors.push('No distribution platforms selected');

    if (errors.length > 0) {
      throw new BadRequestException(`Cannot submit: ${errors.join('; ')}`);
    }

    await this.releaseRepo.update(id, {
      status: ReleaseStatus.PENDING,
      submittedAt: new Date(),
      submissionNotes: notes || release.submissionNotes,
    });

    this.logger.log(`Release ${id} submitted for review by user ${userId}`);

    return this.findOne(id, userId);
  }

  // ── Approve ─────────────────────────────────────────────────────────────────

  async approve(id: string, adminId: string, notes?: string): Promise<Release> {
    const release = await this.findOne(id);
    if (release.status !== ReleaseStatus.PENDING) {
      throw new BadRequestException('Only pending releases can be approved');
    }

    await this.releaseRepo.update(id, {
      status: ReleaseStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNotes: notes,
    });

    // Queue for distribution
    await this.releasesQueue.add('distribute', { releaseId: id }, { delay: 1000 });

    // Notify artist
    try {
      const user = await this.userRepo.findOne({ where: { id: release.userId } });
      if (user) {
        await this.mailService.sendMail({
          to: user.email,
          subject: `Your release "${release.title}" has been approved`,
          html: `<p>Great news! Your release <strong>${release.title}</strong> has been approved and is being prepared for distribution.</p>${notes ? `<p>Reviewer notes: ${notes}</p>` : ''}`,
        });
      }
    } catch (e) {
      this.logger.warn('Failed to send approval email', e);
    }

    return this.findOne(id);
  }

  // ── Reject ──────────────────────────────────────────────────────────────────

  async reject(id: string, adminId: string, reason: string): Promise<Release> {
    const release = await this.findOne(id);
    if (release.status !== ReleaseStatus.PENDING) {
      throw new BadRequestException('Only pending releases can be rejected');
    }
    if (!reason?.trim()) throw new BadRequestException('Rejection reason is required');

    await this.releaseRepo.update(id, {
      status: ReleaseStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      rejectedReason: reason,
    });

    try {
      const user = await this.userRepo.findOne({ where: { id: release.userId } });
      if (user) {
        await this.mailService.sendMail({
          to: user.email,
          subject: `Your release "${release.title}" needs changes`,
          html: `<p>Your release <strong>${release.title}</strong> requires the following changes before it can be approved:</p><blockquote>${reason}</blockquote><p>Please log in, update your release, and re-submit.</p>`,
        });
      }
    } catch (e) {
      this.logger.warn('Failed to send rejection email', e);
    }

    return this.findOne(id);
  }

  // ── Admin list all ──────────────────────────────────────────────────────────

  async findAllAdmin(
    page = 1,
    limit = 25,
    status?: string,
    search?: string,
  ): Promise<{ data: Release[]; total: number }> {
    const qb = this.releaseRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.songs', 's')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('r.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(LOWER(r.title) LIKE :s OR LOWER(u.email) LIKE :s OR LOWER(r.labelName) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async delete(id: string, userId: string): Promise<void> {
    const release = await this.findOne(id, userId);
    if (release.status !== ReleaseStatus.DRAFT) {
      throw new BadRequestException('Only draft releases can be deleted');
    }
    await this.releaseRepo.delete(id);
  }

  // ── Admin patch metadata ────────────────────────────────────────────────────

  async adminPatchMetadata(id: string, adminId: string, dto: Partial<CreateReleaseDto>): Promise<Release> {
    const release = await this.findOne(id);
    const allowed = ['title', 'genre', 'subgenre', 'language', 'labelName', 'upc', 'parentalAdvisory', 'artistCredits', 'contributorCredits', 'publishingShares'];
    const patch: any = {};
    for (const k of allowed) {
      if ((dto as any)[k] !== undefined) patch[k] = (dto as any)[k];
    }
    await this.releaseRepo.update(id, patch);
    return this.findOne(id);
  }
}
