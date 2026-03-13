/**
 * Distribution Service
 * Pluggable adapter pattern for platform integrations.
 * Add adapters for Spotify, Apple Music, TikTok, etc. here.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface DistributionAdapter {
  platformId: string;
  platformName: string;
  submit(release: DistributionRelease): Promise<DistributionResult>;
  checkStatus(platformReleaseId: string): Promise<PlatformStatus>;
  takedown(platformReleaseId: string): Promise<void>;
}

export interface DistributionRelease {
  id: string;
  title: string;
  type: string;
  artworkUrl: string;
  releaseDate: string;
  upc?: string;
  genre?: string;
  language?: string;
  labelName?: string;
  tracks: DistributionTrack[];
}

export interface DistributionTrack {
  title: string;
  artistName: string;
  featuredArtists: string[];
  isrc?: string;
  isExplicit: boolean;
  audioUrl: string;
  trackNumber: number;
  composer?: string;
  producer?: string;
}

export interface DistributionResult {
  success: boolean;
  platformReleaseId?: string;
  platformUrl?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface PlatformStatus {
  status: 'pending' | 'live' | 'rejected' | 'takedown';
  liveAt?: Date;
  platformUrl?: string;
}

// ─── Stub Adapters (implement with real APIs) ────────────────────────────────

/**
 * Spotify for Artists / Spotify Distro API adapter
 * Docs: https://developer.spotify.com/documentation/
 */
export class SpotifyAdapter implements DistributionAdapter {
  platformId = 'spotify';
  platformName = 'Spotify';

  async submit(release: DistributionRelease): Promise<DistributionResult> {
    // TODO: Implement Spotify distribution API
    // 1. Authenticate with Spotify API (client credentials)
    // 2. Create release object
    // 3. Upload tracks
    // 4. Submit for review
    throw new Error('Spotify adapter not yet implemented. Coming soon.');
  }

  async checkStatus(platformReleaseId: string): Promise<PlatformStatus> {
    throw new Error('Not implemented');
  }

  async takedown(platformReleaseId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

/**
 * Apple Music / iTunes Connect adapter
 * Docs: https://developer.apple.com/documentation/applemusicapi/
 */
export class AppleMusicAdapter implements DistributionAdapter {
  platformId = 'apple_music';
  platformName = 'Apple Music';

  async submit(release: DistributionRelease): Promise<DistributionResult> {
    // TODO: Implement Apple Music distribution
    // 1. Use iTunes Connect / Transporter tool
    // 2. Create ITMSP package (XML + audio + artwork)
    // 3. Upload via Transporter
    throw new Error('Apple Music adapter not yet implemented. Coming soon.');
  }

  async checkStatus(platformReleaseId: string): Promise<PlatformStatus> {
    throw new Error('Not implemented');
  }

  async takedown(platformReleaseId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

/**
 * YouTube Music / Content ID adapter
 */
export class YouTubeMusicAdapter implements DistributionAdapter {
  platformId = 'youtube_music';
  platformName = 'YouTube Music';

  async submit(release: DistributionRelease): Promise<DistributionResult> {
    // TODO: Implement YouTube Music distribution
    // 1. Use YouTube Content ID API
    // 2. Create asset and policy
    // 3. Upload audio
    throw new Error('YouTube Music adapter not yet implemented. Coming soon.');
  }

  async checkStatus(platformReleaseId: string): Promise<PlatformStatus> {
    throw new Error('Not implemented');
  }

  async takedown(platformReleaseId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

/**
 * TikTok SoundOn adapter
 * Docs: https://soundon.tiktok.com/
 */
export class TikTokAdapter implements DistributionAdapter {
  platformId = 'tiktok';
  platformName = 'TikTok';

  async submit(release: DistributionRelease): Promise<DistributionResult> {
    // TODO: Implement TikTok SoundOn distribution
    throw new Error('TikTok adapter not yet implemented. Coming soon.');
  }

  async checkStatus(platformReleaseId: string): Promise<PlatformStatus> {
    throw new Error('Not implemented');
  }

  async takedown(platformReleaseId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

/**
 * Deezer / FUGA distribution adapter
 */
export class DeezerAdapter implements DistributionAdapter {
  platformId = 'deezer';
  platformName = 'Deezer';

  async submit(release: DistributionRelease): Promise<DistributionResult> {
    // TODO: Implement Deezer distribution (usually through FUGA or similar)
    throw new Error('Deezer adapter not yet implemented. Coming soon.');
  }

  async checkStatus(platformReleaseId: string): Promise<PlatformStatus> {
    throw new Error('Not implemented');
  }

  async takedown(platformReleaseId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

// ─── Distribution Service ────────────────────────────────────────────────────

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  private readonly adapters = new Map<string, DistributionAdapter>([
    ['spotify', new SpotifyAdapter()],
    ['apple_music', new AppleMusicAdapter()],
    ['youtube_music', new YouTubeMusicAdapter()],
    ['tiktok', new TikTokAdapter()],
    ['deezer', new DeezerAdapter()],
  ]);

  /**
   * Submit a release to one or more platforms.
   * Called from BullMQ processor after admin approval.
   */
  async submitToAllPlatforms(
    release: DistributionRelease,
    platforms: string[],
  ): Promise<Record<string, DistributionResult>> {
    const results: Record<string, DistributionResult> = {};

    for (const platformId of platforms) {
      const adapter = this.adapters.get(platformId);
      if (!adapter) {
        this.logger.warn(`No adapter found for platform: ${platformId}`);
        results[platformId] = { success: false, errorMessage: 'Adapter not found' };
        continue;
      }

      try {
        this.logger.log(`Submitting "${release.title}" to ${adapter.platformName}`);
        results[platformId] = await adapter.submit(release);
        this.logger.log(`✓ Submitted to ${adapter.platformName}`);
      } catch (error: any) {
        this.logger.error(`Failed to submit to ${adapter.platformName}: ${error.message}`);
        results[platformId] = { success: false, errorMessage: error.message };
      }
    }

    return results;
  }

  /**
   * Register a custom adapter at runtime.
   * Use this to add new platforms without modifying core code.
   */
  registerAdapter(adapter: DistributionAdapter): void {
    this.adapters.set(adapter.platformId, adapter);
    this.logger.log(`Registered distribution adapter: ${adapter.platformName}`);
  }

  getAvailablePlatforms(): string[] {
    return Array.from(this.adapters.keys());
  }
}
