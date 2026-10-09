import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEmail,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';

export enum Department {
  ENGINEERING = 'engineering',
  HR = 'hr',
  SALES = 'sales',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  @MaxLength(30, { message: 'Name cannot exceed 30 characters' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @Matches(/^[a-z]+(?:[ '-][a-z]+)*$/, {
    message:
      'Name can only contain lowercase letters, single spaces, hyphens or apostrophes',
  })
  @IsString({ message: 'Enter valid name of alphabets!' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsString()
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @Column({ type: 'int' })
  @Max(100000, { message: 'Salary cannot exceed $100000' })
  @Min(10000, { message: 'Salary must be min $10000 or more!' })
  @IsInt({ message: 'Salary needs to be in valid Integer value range' })
  @IsNotEmpty()
  @Type(() => Number)
  salary: number;

  @Column({ type: 'enum', enum: Department })
  @IsEnum(Department, {
    message: `Department must be one of: ${Object.values(Department).join(', ')}`,
  })
  @IsString()
  @IsNotEmpty({ message: 'Department cannot be empty' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  department: Department;

  @Column({ type: 'int', default: 18, nullable: true })
  @IsOptional()
  @Max(120, { message: 'Age cannot exceed 120' })
  @Min(18, { message: 'Age must be at least 18' })
  @IsInt()
  @Type(() => Number)
  age?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// PATCH body: every field optional, system-managed fields excluded
export class UpdateEmployee extends PartialType(
  OmitType(Employee, ['id', 'createdAt', 'updatedAt'] as const),
) {}

// GET /employees/all query params
export class FilterEmployee {
  @IsOptional()
  @Min(1, { message: 'ID must be 1 or more' })
  @IsInt({ message: 'ID must be a valid integer' })
  @Type(() => Number) // query params arrive as strings
  id?: number;

  @IsOptional()
  @IsEnum(Department, {
    message: `Department must be one of: ${Object.values(Department).join(', ')}`,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  department?: Department;
}
