import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register({ email, password }: User) {
    if (await this.users.findOneBy({ email })) {
      throw new ConflictException('Email already registered');
    }
    const hash = await bcrypt.hash(password, 10);
    await this.users.save(this.users.create({ email, password: hash }));
    return { message: 'Registered successfully' };
  }

  async login({ email, password }: User) {
    const user = await this.users.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      access_token: await this.jwt.signAsync({
        sub: user.id,
        email: user.email,
      }),
    };
  }
}
