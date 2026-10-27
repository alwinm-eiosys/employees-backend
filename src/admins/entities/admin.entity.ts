import { Exclude, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
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

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Transform(normalizeEmail)
  email!: string;

  // Not selected by normal queries and excluded from serialized responses.
  // Login explicitly selects this field to compare the bcrypt hash.
  @Column({ type: 'varchar', length: 255, select: false })
  @Exclude({ toPlainOnly: true })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be no more than 72 characters' })
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}

// Request input types are colocated here to match the existing employee entity pattern.
// Only email and password are client-editable; IDs and timestamps are system-managed.
export class AdminCreateInput {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Transform(normalizeEmail)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be no more than 72 characters' })
  password!: string;
}

export class AdminPatchInput extends PartialType(AdminCreateInput) {}
