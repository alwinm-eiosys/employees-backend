import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Admin, AdminCreateInput, AdminPatchInput } from './entities/admin.entity';

export type PublicAdmin = { id: number; email: string };

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
    private readonly dataSource: DataSource,
  ) {}

  private publicFields(admin: Admin): PublicAdmin {
    return { id: admin.id, email: admin.email };
  }

  private assertPasswordByteLength(password: string): void {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Password must be no more than 72 UTF-8 bytes');
    }
  }

  private async throwIfEmailConflict(error: unknown): Promise<never> {
    if (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505'
    ) {
      throw new ConflictException('An admin with this email already exists');
    }
    throw error;
  }

  async findAll(): Promise<PublicAdmin[]> {
    const admins = await this.admins.find({
      select: { id: true, email: true },
      order: { id: 'ASC' },
    });
    return admins.map((admin) => this.publicFields(admin));
  }

  async findOne(id: number): Promise<PublicAdmin> {
    const admin = await this.admins.findOne({
      where: { id },
      select: { id: true, email: true },
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return this.publicFields(admin);
  }

  async create(dto: AdminCreateInput): Promise<PublicAdmin> {
    this.assertPasswordByteLength(dto.password);
    const admin = this.admins.create({
      email: dto.email.trim().toLowerCase(),
      password: await bcrypt.hash(dto.password, 10),
    });
    try {
      const saved = await this.admins.save(admin);
      return this.publicFields(saved);
    } catch (error) {
      return this.throwIfEmailConflict(error);
    }
  }

  async update(id: number, dto: AdminPatchInput): Promise<PublicAdmin> {
    // PartialType validation treats null as optional, so normalize nulls here too.
    const email = dto.email as string | null | undefined;
    const password = dto.password as string | null | undefined;
    if (email == null && password == null) {
      throw new BadRequestException('Provide an email, a password, or both to update');
    }

    const admin = await this.admins.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');

    const patch: Partial<Pick<Admin, 'email' | 'password'>> = {};
    if (email != null) patch.email = email.trim().toLowerCase();
    if (password != null) {
      this.assertPasswordByteLength(password);
      patch.password = await bcrypt.hash(password, 10);
    }

    try {
      await this.admins.update(id, patch);
    } catch (error) {
      return this.throwIfEmailConflict(error);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    // Serialize deletes so two concurrent requests cannot remove every admin.
    await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [741852963]);
      const repository = manager.getRepository(Admin);
      const target = await repository.findOne({ where: { id } });
      if (!target) throw new NotFoundException('Admin not found');
      if ((await repository.count()) <= 1) {
        throw new ConflictException('The last admin cannot be deleted');
      }
      await repository.softDelete(id);
    });
  }
}
