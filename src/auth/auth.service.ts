import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { Admin, CreateAdmin, LoginAdmin } from './entities/admin.entity';

export type PublicAdmin = { id: number; email: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private assertPasswordByteLength(password: string): void {
    // bcrypt only considers the first 72 UTF-8 bytes.
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Password must be no more than 72 UTF-8 bytes');
    }
  }

  async login({ email, password }: LoginAdmin) {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // password has select:false, so explicitly select it for bcrypt comparison.
    const admin = await this.admins
      .createQueryBuilder('admin')
      .addSelect('admin.password')
      .where('admin.email = :email', {
        email: email.trim().toLowerCase(),
      })
      .getOne();

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: await this.jwt.signAsync({
        sub: admin.id,
        email: admin.email,
      }),
    };
  }


  // a one-time setup mechanism to create your first admin account when the admins table is empty. Since you have 
  // login-only authentication, you need some way to create that first account without allowing public registration.
  
  async bootstrapFirstAdmin(
    input: CreateAdmin,
    suppliedSecret: string | undefined,
  ): Promise<PublicAdmin> {
    const expectedSecret = this.config.get<string>('ADMIN_BOOTSTRAP_SECRET');

    if (!expectedSecret) {
      throw new ForbiddenException(
        'Admin bootstrap is disabled. Set ADMIN_BOOTSTRAP_SECRET temporarily, then restart the API.',
      );
    }

    if (!suppliedSecret || suppliedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid bootstrap secret');
    }

    this.assertPasswordByteLength(input.password);

    // A transaction-scoped PostgreSQL advisory lock prevents two concurrent
    // requests from both creating the first administrator.
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [741852963]);
      const repository = manager.getRepository(Admin);

      // Include soft-deleted rows so bootstrap cannot be reused after setup.
      const existingAdminCount = await repository
        .createQueryBuilder('admin')
        .withDeleted()
        .getCount();

      if (existingAdminCount > 0) {
        throw new ConflictException(
          'An admin already exists. Bootstrap can only create the first admin.',
        );
      }

      const admin = repository.create({
        email: input.email.trim().toLowerCase(),
        password: await bcrypt.hash(input.password, 10),
      });
      const saved = await repository.save(admin);

      // Return only public fields; never return the password hash.
      return { id: saved.id, email: saved.email };
    });
  }
}
