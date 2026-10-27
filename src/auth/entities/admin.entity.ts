import { Exclude, Transform } from 'class-transformer';
import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  // Exclude the hash from ordinary queries and serialized entity responses.
  // Login explicitly selects this column when it needs to compare the hash.
  @Column({ type: 'varchar', length: 255, select: false })
  @Exclude({ toPlainOnly: true })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be no more than 72 characters' })
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}

// Request types stay in this file, following the existing Employee entity pattern.
// Clients can edit only email/password; IDs and timestamps are managed by the server.
export class CreateAdmin extends OmitType(
  Admin,
  ['id', 'createdAt', 'updatedAt', 'deletedAt'] as const,
) {}

export class UpdateAdmin extends PartialType(
  OmitType(Admin, ['id', 'createdAt', 'updatedAt', 'deletedAt'] as const),
) {}

// Login uses the same validation/transformation metadata without a separate DTO file.
export class LoginAdmin extends PickType(Admin, ['email', 'password'] as const) {}
