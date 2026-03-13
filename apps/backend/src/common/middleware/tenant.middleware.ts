import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branding } from '../../branding/entities/branding.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Branding)
    private readonly brandingRepo: Repository<Branding>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers['x-domain'] as string || req.headers.host || '';
    const domain = host.split(':')[0]; // strip port

    try {
      // Look up branding by domain
      const branding = await this.brandingRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.domain', 'domain')
        .where('domain.domain = :domain', { domain })
        .andWhere('b.is_active = true')
        .getOne();

      if (branding) {
        (req as any).tenant = {
          brandingId: branding.id,
          platformName: branding.platformName,
          primaryColor: branding.primaryColor,
          logoUrl: branding.logoUrl,
        };
      } else {
        // Default branding
        (req as any).tenant = {
          platformName: 'MREC Entertainment',
          primaryColor: '#7C3AED',
        };
      }
    } catch {
      (req as any).tenant = { platformName: 'MREC Entertainment' };
    }

    next();
  }
}
