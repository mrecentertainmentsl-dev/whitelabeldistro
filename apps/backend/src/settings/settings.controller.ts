import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Setting } from './entities/setting.entity';
import * as crypto from 'crypto';

const ENCRYPTED_KEYS = [
  'aws_access_key_id', 'aws_secret_access_key',
  'aws_ses_access_key', 'aws_ses_secret_key',
  'smtp_password',
];

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class SettingsController {
  private encKey: Buffer;

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {
    const key = process.env.ENCRYPTION_KEY || 'default-32-char-key-change-me!!';
    this.encKey = Buffer.from(key.padEnd(32).slice(0, 32));
  }

  @Get()
  @ApiOperation({ summary: '[Admin] Get all settings (secrets masked)' })
  async getAll() {
    const settings = await this.settingRepo.find({ order: { category: 'ASC', key: 'ASC' } });
    return settings.map(s => ({
      ...s,
      value: s.isEncrypted ? '••••••••' : s.value,
      encryptedValue: undefined,
    }));
  }

  @Get(':key')
  @ApiOperation({ summary: '[Admin] Get a specific setting' })
  async getOne(@Param('key') key: string) {
    const setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) return null;
    return {
      ...setting,
      value: setting.isEncrypted ? '••••••••' : setting.value,
      encryptedValue: undefined,
    };
  }

  @Put()
  @ApiOperation({ summary: '[Admin] Bulk update settings' })
  async updateBulk(@Body() body: Record<string, string>) {
    const updated = [];
    for (const [key, value] of Object.entries(body)) {
      let setting = await this.settingRepo.findOne({ where: { key } });
      if (!setting) {
        setting = this.settingRepo.create({ key, category: 'general' });
      }

      if (ENCRYPTED_KEYS.includes(key)) {
        setting.encryptedValue = this.encrypt(value);
        setting.isEncrypted = true;
        setting.value = null;
      } else {
        setting.value = value;
        setting.isEncrypted = false;
      }

      updated.push(await this.settingRepo.save(setting));
    }
    return { updated: updated.length };
  }

  @Put(':key')
  @ApiOperation({ summary: '[Admin] Update a single setting' })
  async updateOne(@Param('key') key: string, @Body('value') value: string) {
    let setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingRepo.create({ key, category: 'general' });
    }

    if (ENCRYPTED_KEYS.includes(key)) {
      setting.encryptedValue = this.encrypt(value);
      setting.isEncrypted = true;
      setting.value = null;
    } else {
      setting.value = value;
    }

    return this.settingRepo.save(setting);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encKey, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
