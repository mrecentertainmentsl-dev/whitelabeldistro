/**
 * Database Seed Script
 * Run: npx ts-node src/database/seeds/seed.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'mrec',
  password: process.env.DATABASE_PASSWORD || 'mrecpassword',
  database: process.env.DATABASE_NAME || 'mrec_db',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Connected to database. Starting seed...');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Ensure roles exist
    await queryRunner.query(`
      INSERT INTO roles (name, description, permissions)
      VALUES
        ('admin', 'Platform administrator', '["*"]'),
        ('artist', 'Music artist or label', '["upload","view_own","manage_own"]'),
        ('label', 'Record label', '["upload","view_own","manage_own","manage_sub_artists"]')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Roles seeded');

    // Admin user
    const adminHash = await bcrypt.hash('Admin@123456', 12);
    await queryRunner.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, display_name, role_id, is_active, is_email_verified)
      VALUES (
        'admin@mrec.io',
        '${adminHash}',
        'Platform',
        'Admin',
        'Platform Admin',
        (SELECT id FROM roles WHERE name = 'admin'),
        true,
        true
      )
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Admin user seeded (admin@mrec.io / Admin@123456)');

    // Demo artist
    const artistHash = await bcrypt.hash('Artist@123456', 12);
    await queryRunner.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, display_name, role_id, is_active, is_email_verified)
      VALUES (
        'artist@demo.io',
        '${artistHash}',
        'Demo',
        'Artist',
        'Demo Artist',
        (SELECT id FROM roles WHERE name = 'artist'),
        true,
        true
      )
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Demo artist seeded (artist@demo.io / Artist@123456)');

    // Default branding
    await queryRunner.query(`
      INSERT INTO branding (
        platform_name, tagline, primary_color, secondary_color,
        accent_color, background_color, text_color, is_active,
        support_email, footer_text
      )
      VALUES (
        'MREC Entertainment',
        'Distribute Your Music Globally',
        '#22c55e', '#16a34a', '#f59e0b',
        '#0d0d0d', '#eeeeee', true,
        'support@mrec.io',
        '© 2025 MREC Entertainment. All rights reserved.'
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Default branding seeded');

    // Core settings
    const settings = [
      ['aws_s3_bucket', '', 'storage', 'AWS S3 Bucket Name'],
      ['aws_s3_region', 'us-east-1', 'storage', 'AWS S3 Region'],
      ['aws_ses_region', 'us-east-1', 'email', 'AWS SES Region'],
      ['aws_ses_from_email', 'noreply@mrec.io', 'email', 'Sender email'],
      ['aws_ses_from_name', 'MREC Entertainment', 'email', 'Sender name'],
      ['max_file_size_mb', '500', 'upload', 'Max audio file size in MB'],
      ['allowed_audio_formats', 'wav,flac', 'upload', 'Allowed audio formats'],
      ['allowed_image_formats', 'jpg,jpeg,png', 'upload', 'Allowed image formats'],
      ['min_artwork_size', '3000', 'upload', 'Min artwork dimension px'],
      ['require_isrc', 'false', 'distribution', 'Require ISRC for tracks'],
      ['auto_approve', 'false', 'admin', 'Auto-approve releases'],
      ['registration_enabled', 'true', 'auth', 'Allow new registrations'],
      ['email_verification_required', 'true', 'auth', 'Require email verification'],
      ['distribution_platforms', 'spotify,apple_music,youtube_music,tiktok,deezer,amazon_music', 'distribution', 'Available platforms'],
    ];

    for (const [key, value, category, description] of settings) {
      await queryRunner.query(`
        INSERT INTO settings (key, value, category, description)
        VALUES ('${key}', '${value}', '${category}', '${description}')
        ON CONFLICT (key) DO NOTHING;
      `);
    }
    console.log('✅ Platform settings seeded');

    await queryRunner.commitTransaction();
    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Admin:  admin@mrec.io / Admin@123456');
    console.log('   Artist: artist@demo.io / Artist@123456');
    console.log('\n⚠️  Change these passwords immediately in production!\n');

  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed().catch(console.error);
