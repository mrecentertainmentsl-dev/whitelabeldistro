import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Song } from './song.entity';

export enum ReleaseType {
  SINGLE      = 'single',
  EP          = 'ep',
  ALBUM       = 'album',
  COMPILATION = 'compilation',
  SOUNDTRACK  = 'soundtrack',
  LIVE        = 'live',
}

export enum ReleaseStatus {
  DRAFT       = 'draft',
  PENDING     = 'pending',
  PROCESSING  = 'processing',
  APPROVED    = 'approved',
  REJECTED    = 'rejected',
  DISTRIBUTED = 'distributed',
  TAKEDOWN    = 'takedown',
}

export enum ParentalAdvisory {
  NONE     = 'none',
  EXPLICIT = 'explicit',
  CLEANED  = 'cleaned',
}

@Entity('releases')
export class Release {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ── Core identity ─────────────────────────────────────────────────────────
  @Column()
  title: string;

  @Column({ type: 'enum', enum: ReleaseType, default: ReleaseType.SINGLE })
  type: ReleaseType;

  @Column({ type: 'enum', enum: ReleaseStatus, default: ReleaseStatus.DRAFT })
  status: ReleaseStatus;

  @Column({ type: 'enum', enum: ParentalAdvisory, name: 'parental_advisory', default: ParentalAdvisory.NONE })
  parentalAdvisory: ParentalAdvisory;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  subgenre: string;

  @Column({ nullable: true })
  language: string;

  @Column({ name: 'label_name', nullable: true })
  labelName: string;

  @Column({ nullable: true })
  upc: string;

  // ── Dates ─────────────────────────────────────────────────────────────────
  @Column({ name: 'release_date', nullable: true, type: 'date' })
  releaseDate: Date;

  @Column({ name: 'original_release_date', nullable: true, type: 'date' })
  originalReleaseDate: Date;

  @Column({ name: 'scheduled_release_time', nullable: true })
  scheduledReleaseTime: string; // HH:MM timezone

  // ── Artwork ───────────────────────────────────────────────────────────────
  @Column({ name: 'artwork_url', nullable: true })
  artworkUrl: string;

  @Column({ name: 'artwork_s3_key', nullable: true })
  artworkS3Key: string;

  @Column({ name: 'artwork_width', nullable: true })
  artworkWidth: number;

  @Column({ name: 'artwork_height', nullable: true })
  artworkHeight: number;

  // ── Distribution ──────────────────────────────────────────────────────────
  @Column({ type: 'text', array: true, default: ['worldwide'] })
  territories: string[];

  @Column({ name: 'distribution_platforms', type: 'text', array: true, default: [] })
  distributionPlatforms: string[];

  // ── Structured credits (DDEX-compatible JSONB) ────────────────────────────
  // Release-level artists: [{ name, role, artistId?, isniCode?, spotifyId?, appleId?, sequenceNo }]
  @Column({ name: 'artist_credits', type: 'jsonb', default: [] })
  artistCredits: Record<string, any>[];

  // Release-level contributors: [{ name, role, ipiNumber?, proAffiliation?, sequenceNo }]
  @Column({ name: 'contributor_credits', type: 'jsonb', default: [] })
  contributorCredits: Record<string, any>[];

  // Release-level publishing: [{ type, name, ipiNumber?, proAffiliation?, sharePercent }]
  @Column({ name: 'publishing_shares', type: 'jsonb', default: [] })
  publishingShares: Record<string, any>[];

  // ── Workflow ──────────────────────────────────────────────────────────────
  @Column({ name: 'submission_notes', nullable: true })
  submissionNotes: string;

  @Column({ name: 'admin_notes', nullable: true })
  adminNotes: string;

  @Column({ name: 'rejected_reason', nullable: true })
  rejectedReason: string;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  // ── Wizard draft state (autosave) ─────────────────────────────────────────
  @Column({ name: 'wizard_step', default: 1 })
  wizardStep: number;

  @Column({ name: 'wizard_draft', type: 'jsonb', default: {} })
  wizardDraft: Record<string, any>;

  // ── Flexible JSON metadata ────────────────────────────────────────────────
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @OneToMany(() => Song, (song) => song.release, { cascade: true })
  songs: Song[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
