import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create(ownerType: 'user' | 'employee', ownerId: number, plainToken: string, expiresAt?: Date | null) {
    const tokenHash = this.hash(plainToken);
    const entity = this.repo.create({ ownerType, ownerId, tokenHash, expiresAt: expiresAt || null });
    return this.repo.save(entity);
  }

  async findByToken(plainToken: string): Promise<RefreshToken | null> {
    const tokenHash = this.hash(plainToken);
    return this.repo.findOne({ where: { tokenHash } });
  }

  async revoke(id: number, replacedById?: number) {
    await this.repo.update(id, { revoked: true, replacedById: replacedById || null });
  }

  async revokeAllForOwner(ownerType: 'user' | 'employee', ownerId: number) {
    await this.repo.update({ ownerType, ownerId }, { revoked: true });
  }
}
