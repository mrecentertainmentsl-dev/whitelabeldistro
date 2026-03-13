import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('branding')
export class Branding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'MREC Entertainment' })
  platformName: string;

  @Column({ nullable: true })
  tagline?: string;

  // ── Core logos ──────────────────────────────────────────────────────
  @Column({ nullable: true }) logoUrl?: string;
  @Column({ nullable: true }) logoS3Key?: string;

  // Light-theme assets
  @Column({ nullable: true }) faviconLightUrl?: string;
  @Column({ nullable: true }) squareLogoLightUrl?: string;
  @Column({ nullable: true }) horizontalLogoLightUrl?: string;

  // Dark-theme assets
  @Column({ nullable: true }) faviconDarkUrl?: string;
  @Column({ nullable: true }) squareLogoDarkUrl?: string;
  @Column({ nullable: true }) horizontalLogoDarkUrl?: string;

  // Login background
  @Column({ nullable: true }) loginBgUrl?: string;

  // ── Colors ──────────────────────────────────────────────────────────
  @Column({ default: '#22c55e' }) primaryColor: string;
  @Column({ default: '#16a34a' }) secondaryColor: string;
  @Column({ default: '#f59e0b' }) accentColor: string;
  @Column({ default: '#0d0d0d' }) backgroundColor: string;
  @Column({ default: '#eeeeee' }) textColor: string;

  // ── Typography ───────────────────────────────────────────────────────
  @Column({ default: 'DM Sans' }) fontHeading: string;
  @Column({ default: 'DM Sans' }) fontBody: string;

  // ── Custom CSS ────────────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true }) customCss?: string;

  // ── Email branding ────────────────────────────────────────────────────
  @Column({ nullable: true }) emailLogoUrl?: string;
  @Column({ nullable: true }) emailHeaderColor?: string;
  @Column({ nullable: true }) emailFooterText?: string;

  // ── Contact ───────────────────────────────────────────────────────────
  @Column({ nullable: true }) supportEmail?: string;
  @Column({ nullable: true }) supportUrl?: string;
  @Column({ nullable: true }) footerText?: string;

  // ── Legal ─────────────────────────────────────────────────────────────
  @Column({ nullable: true }) termsUrl?: string;
  @Column({ nullable: true }) privacyUrl?: string;

  // ── Social ────────────────────────────────────────────────────────────
  @Column({ type: 'jsonb', default: '{}' }) socialLinks: Record<string, string>;

  // ── Status ────────────────────────────────────────────────────────────
  @Column({ default: true }) isActive: boolean;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
