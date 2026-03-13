import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Release } from './release.entity';
import { User } from '../../users/entities/user.entity';

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'release_id' })
  releaseId: string;

  @ManyToOne(() => Release, (release) => release.songs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'release_id' })
  release: Release;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ── Core identity ─────────────────────────────────────────────────────────
  @Column()
  title: string;

  @Column({ name: 'title_version', nullable: true })
  titleVersion: string;

  @Column({ name: 'track_number', default: 1 })
  trackNumber: number;

  @Column({ name: 'disc_number', default: 1 })
  discNumber: number;

  @Column({ nullable: true })
  isrc: string;

  @Column({ name: 'is_explicit', default: false })
  isExplicit: boolean;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  language: string;

  @Column({ name: 'lyrics_language', nullable: true })
  lyricsLanguage: string;

  @Column({ type: 'text', nullable: true })
  lyrics: string;

  @Column({ name: 'preview_start_seconds', nullable: true })
  previewStartSeconds: number;

  // ── Legacy flat fields ────────────────────────────────────────────────────
  @Column({ name: 'artist_name', nullable: true })
  artistName: string;

  @Column({ name: 'featured_artists', type: 'text', array: true, default: [] })
  featuredArtists: string[];

  @Column({ nullable: true })
  composer: string;

  @Column({ nullable: true })
  producer: string;

  @Column({ nullable: true })
  lyricist: string;

  // ── Structured credits (DDEX-compatible JSONB) ────────────────────────────
  @Column({ name: 'artist_credits', type: 'jsonb', default: [] })
  artistCredits: Record<string, any>[];

  @Column({ name: 'contributor_credits', type: 'jsonb', default: [] })
  contributorCredits: Record<string, any>[];

  @Column({ name: 'publishing_shares', type: 'jsonb', default: [] })
  publishingShares: Record<string, any>[];

  // ── Audio file ────────────────────────────────────────────────────────────
  @Column({ name: 'audio_url', nullable: true })
  audioUrl: string;

  @Column({ name: 'audio_s3_key', nullable: true })
  audioS3Key: string;

  @Column({ name: 'audio_format', nullable: true })
  audioFormat: string;

  @Column({ name: 'audio_size_bytes', nullable: true, type: 'bigint' })
  audioSizeBytes: number;

  @Column({ name: 'audio_bitrate', nullable: true })
  audioBitrate: number;

  @Column({ name: 'audio_sample_rate', nullable: true })
  audioSampleRate: number;

  @Column({ name: 'audio_bit_depth', nullable: true })
  audioBitDepth: number;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ nullable: true })
  bpm: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
