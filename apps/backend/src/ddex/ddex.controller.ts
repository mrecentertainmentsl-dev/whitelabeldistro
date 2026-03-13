import {
  Controller, Get, Post, Param, Query, Res, Body,
  UseGuards, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { DdexService, DdexRelease, DdexConfig } from './ddex.service';
import { Release } from '../releases/entities/release.entity';
import { Setting } from '../settings/entities/setting.entity';

@ApiTags('ddex')
@Controller('ddex')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class DdexController {
  constructor(
    private readonly ddexService: DdexService,
    @InjectRepository(Release) private readonly releaseRepo: Repository<Release>,
    @InjectRepository(Setting) private readonly settingRepo: Repository<Setting>,
  ) {}

  private async getConfig(): Promise<DdexConfig> {
    const settings = await this.settingRepo.find();
    const sm: Record<string, string> = {};
    settings.forEach(s => { sm[s.key] = s.value || ''; });
    return {
      senderDpid: sm['ddex_sender_dpid'] || 'PADPIDA_MREC_001',
      senderName: sm['ddex_sender_name'] || 'MREC Entertainment',
      ern_version: sm['ddex_ern_version'] || '4.3',
    };
  }

  private async loadRelease(id: string): Promise<Release> {
    const release = await this.releaseRepo.findOne({
      where: { id },
      relations: ['songs', 'user'],
    });
    if (!release) throw new NotFoundException('Release not found');
    return release;
  }

  private toddexRelease(release: Release): DdexRelease {
    return {
      id: release.id,
      title: release.title,
      type: release.type,
      artworkUrl: release.artworkUrl,
      releaseDate: release.releaseDate?.toISOString(),
      upc: release.upc,
      genre: release.genre,
      language: release.language,
      labelName: release.labelName,
      distributionPlatforms: release.distributionPlatforms || [],
      songs: (release.songs || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        artistName: s.artistName,
        featuredArtists: s.featuredArtists || [],
        composer: s.composer,
        producer: s.producer,
        lyricist: s.lyricist,
        isrc: s.isrc,
        durationSeconds: s.durationSeconds,
        trackNumber: s.trackNumber || 1,
        isExplicit: s.isExplicit || false,
        audioUrl: s.audioUrl,
        audioFormat: s.audioFormat,
        audioBitrate: s.audioBitrate,
        audioSampleRate: s.audioSampleRate,
        genre: s.genre || release.genre,
        language: s.language || release.language,
      })),
      artist: {
        name: (release.songs?.[0] as any)?.artistName || (release.user as any)?.displayName || 'Unknown Artist',
      },
    };
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate a release for DDEX ERN 4.3 compliance' })
  async validate(@Param('id') id: string) {
    const release = await this.loadRelease(id);
    return this.ddexService.validateForDdex(release);
  }

  @Get(':id/xml')
  @ApiOperation({ summary: 'Generate DDEX ERN 4.3 NewReleaseMessage XML for a release' })
  async generateXml(
    @Param('id') id: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    const release = await this.loadRelease(id);
    if (release.status !== 'approved' && release.status !== 'distributed') {
      throw new BadRequestException('Release must be approved before generating DDEX XML');
    }

    const config = await this.getConfig();
    const ddexRelease = this.toddexRelease(release);
    const validation = this.ddexService.validateForDdex(release);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Release failed DDEX validation',
        errors: validation.errors,
      });
    }

    const xml = this.ddexService.generateNewReleaseMessage(ddexRelease, config);
    const filename = `MREC_${release.id.replace(/-/g, '').toUpperCase().slice(0, 12)}_ERN43.xml`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    if (download) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    res.send(xml);
  }

  @Get(':id/purge-xml')
  @ApiOperation({ summary: 'Generate DDEX ERN 4.3 PurgeReleaseMessage for takedown' })
  async generatePurgeXml(@Param('id') id: string, @Res() res: Response) {
    const release = await this.loadRelease(id);
    const config = await this.getConfig();
    const xml = this.ddexService.generatePurgeReleaseMessage(release.id, release.upc, config);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="PURGE_${release.id.slice(0, 12).toUpperCase()}_ERN43.xml"`);
    res.send(xml);
  }

  @Post('bulk-export')
  @ApiOperation({ summary: 'Export DDEX ERN 4.3 XML for multiple releases (returns JSON manifest)' })
  async bulkExport(@Body() body: { ids: string[] }) {
    if (!body.ids?.length) throw new BadRequestException('No release IDs provided');
    const config = await this.getConfig();
    const results = [];

    for (const id of body.ids.slice(0, 50)) { // max 50 at a time
      try {
        const release = await this.loadRelease(id);
        const ddexRelease = this.toddexRelease(release);
        const validation = this.ddexService.validateForDdex(release);

        results.push({
          id,
          title: release.title,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          xmlEndpoint: `/api/v1/ddex/${id}/xml?download=1`,
        });
      } catch (e: any) {
        results.push({ id, title: '?', valid: false, errors: [e.message] });
      }
    }

    return { config, results };
  }
}
