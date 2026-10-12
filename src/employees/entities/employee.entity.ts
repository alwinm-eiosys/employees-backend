import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Type, Transform, Exclude } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsUrl,
  IsArray,
  IsDateString,
  ArrayMaxSize,
  Min,
  Max,
  Matches,
} from 'class-validator';

/* ----------------------------- Enums ----------------------------- */

export enum Department {
  ENGINEERING = 'engineering',
  HR = 'hr',
  SALES = 'sales',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum EmploymentType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERN = 'intern',
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on-leave',
  TERMINATED = 'terminated',
}

/* --------------------------- Helpers ---------------------------- */

// Postgres returns numeric/decimal columns as strings; convert to number
const numericTransformer = {
  to: (value?: number | null) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
};

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

const toLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const toUpper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const NAME_REGEX = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

/* --------------------------- Entity ----------------------------- */

@Entity('employees')
export class Employee {
  // ---------- Basic details ----------
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  @Matches(NAME_REGEX, { message: 'First name can only contain letters' })
  @MaxLength(50)
  @MinLength(2)
  @IsString()
  @IsNotEmpty({ message: 'First name cannot be empty' })
  @Transform(trim)
  firstName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @Matches(NAME_REGEX, { message: 'Middle name can only contain letters' })
  @MaxLength(50)
  @IsString()
  @Transform(trim)
  middleName?: string;

  @Column({ type: 'varchar', length: 50 })
  @Matches(NAME_REGEX, { message: 'Last name can only contain letters' })
  @MaxLength(50)
  @MinLength(1)
  @IsString()
  @IsNotEmpty({ message: 'Last name cannot be empty' })
  @Transform(trim)
  lastName: string;

  @Column({ type: 'date' })
  @IsDateString({}, { message: 'Date of birth must be a valid date (YYYY-MM-DD)' })
  @IsNotEmpty()
  dateOfBirth: string;

  @Column({ type: 'enum', enum: Gender })
  @IsEnum(Gender, {
    message: `Gender must be one of: ${Object.values(Gender).join(', ')}`,
  })
  @IsNotEmpty()
  @Transform(toLower)
  gender: Gender;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'Profile photo must be a valid URL' })
  @MaxLength(500)
  @Transform(trim)
  profilePhotoUrl?: string;

  // ---------- Contact details ----------
  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @Transform(toLower)
  email: string;

  @Column({ type: 'varchar', length: 10 })
  @Matches(MOBILE_REGEX, {
    message: 'Mobile number must be a valid 10-digit Indian number',
  })
  @IsNotEmpty()
  @Transform(trim)
  mobileNumber: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @IsOptional()
  @Matches(MOBILE_REGEX, {
    message: 'Alternate mobile number must be a valid 10-digit Indian number',
  })
  @Transform(trim)
  alternateMobileNumber?: string;

  @Column({ type: 'varchar', length: 150 })
  @MaxLength(150)
  @IsString()
  @IsNotEmpty({ message: 'Address line 1 cannot be empty' })
  @Transform(trim)
  addressLine1: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  @IsOptional()
  @MaxLength(150)
  @IsString()
  @Transform(trim)
  addressLine2?: string;

  @Column({ type: 'varchar', length: 60 })
  @MaxLength(60)
  @IsString()
  @IsNotEmpty({ message: 'City cannot be empty' })
  @Transform(trim)
  city: string;

  @Column({ type: 'varchar', length: 60 })
  @MaxLength(60)
  @IsString()
  @IsNotEmpty({ message: 'State cannot be empty' })
  @Transform(trim)
  state: string;

  @Column({ type: 'varchar', length: 60 })
  @MaxLength(60)
  @IsString()
  @IsNotEmpty({ message: 'Country cannot be empty' })
  @Transform(trim)
  country: string;

  @Column({ type: 'varchar', length: 6 })
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  @IsNotEmpty()
  @Transform(trim)
  pincode: string;

  // ---------- Employment details ----------
  @Column({ type: 'varchar', length: 20, unique: true })
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Employee code can only contain letters, numbers and hyphens',
  })
  @MaxLength(20)
  @IsString()
  @IsNotEmpty({ message: 'Employee code cannot be empty' })
  @Transform(toUpper)
  employeeCode: string;

  @Column({ type: 'enum', enum: Department })
  @IsEnum(Department, {
    message: `Department must be one of: ${Object.values(Department).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Department cannot be empty' })
  @Transform(toLower)
  department: Department;

  @Column({ type: 'varchar', length: 100 })
  @MaxLength(100)
  @IsString()
  @IsNotEmpty({ message: 'Designation cannot be empty' })
  @Transform(toLower)
  designation: string;

  @Column({ type: 'enum', enum: EmploymentType })
  @IsEnum(EmploymentType, {
    message: `Employment type must be one of: ${Object.values(EmploymentType).join(', ')}`,
  })
  @IsNotEmpty()
  @Transform(toLower)
  employmentType: EmploymentType;

  @Column({ type: 'date' })
  @IsDateString({}, { message: 'Date of joining must be a valid date (YYYY-MM-DD)' })
  @IsNotEmpty()
  dateOfJoining: string;

  // Self-referencing: the manager is another Employee row
  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportingManagerId' })
  reportingManager?: Employee | null;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @Min(1)
  @IsInt({ message: 'Reporting manager ID must be a valid integer' })
  @Type(() => Number)
  reportingManagerId?: number | null;

  @Column({ type: 'varchar', length: 100 })
  @MaxLength(100)
  @IsString()
  @IsNotEmpty({ message: 'Work location cannot be empty' })
  @Transform(trim)
  workLocation: string;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmploymentStatus, {
    message: `Employment status must be one of: ${Object.values(EmploymentStatus).join(', ')}`,
  })
  @Transform(toLower)
  employmentStatus: EmploymentStatus;

  // ---------- Salary details ----------
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  @Max(10000000, { message: 'Basic salary is too large' })
  @Min(1, { message: 'Basic salary must be greater than 0' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Type(() => Number)
  basicSalary: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  @IsOptional()
  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  hra: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  @IsOptional()
  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  allowances: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  @IsOptional()
  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  deductions: number;

  // Sensitive: never loaded by default and never serialized in responses
  @Column({ type: 'varchar', length: 18, select: false })
  @Exclude({ toPlainOnly: true })
  @Matches(/^\d{9,18}$/, {
    message: 'Bank account number must be 9 to 18 digits',
  })
  @IsNotEmpty()
  @Transform(trim)
  bankAccountNumber: string;

  @Column({ type: 'varchar', length: 11, select: false })
  @Exclude({ toPlainOnly: true })
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Enter a valid IFSC code' })
  @IsNotEmpty()
  @Transform(toUpper)
  ifscCode: string;

  // ---------- Additional details ----------
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @MaxLength(100)
  @IsString()
  @Transform(trim)
  highestQualification?: string;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    default: 0,
    transformer: numericTransformer,
  })
  @IsOptional()
  @Max(60)
  @Min(0)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Type(() => Number)
  previousExperience: number;

  @Column({ type: 'text', array: true, nullable: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsArray({ message: 'Skills must be an array of strings' })
  skills?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @Matches(NAME_REGEX, {
    message: 'Emergency contact name can only contain letters',
  })
  @MaxLength(100)
  @IsString()
  @Transform(trim)
  emergencyContactName?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @IsOptional()
  @Matches(MOBILE_REGEX, {
    message: 'Emergency contact number must be a valid 10-digit Indian number',
  })
  @Transform(trim)
  emergencyContactNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  @IsString()
  @Transform(toLower)
  emergencyContactRelationship?: string;

  // ---------- System-managed ----------
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Soft delete: set by softRemove(), hidden from find() automatically
  @DeleteDateColumn()
  deletedAt?: Date;
}

/* ------------------------ PATCH body ------------------------- */

// Every field optional, system-managed fields and the relation object excluded
export class UpdateEmployee extends PartialType(
  OmitType(Employee, ['id', 'createdAt', 'updatedAt', 'deletedAt', 'reportingManager'] as const),
) {}

/* ----------------- GET /employees query params ----------------- */

export enum SortField {
  ID = 'id',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  EMPLOYEE_CODE = 'employeeCode',
  DATE_OF_JOINING = 'dateOfJoining',
  BASIC_SALARY = 'basicSalary',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FilterEmployee {
  // pagination
  @IsOptional()
  @Min(1, { message: 'Page must be 1 or more' })
  @IsInt({ message: 'Page must be a valid integer' })
  @Type(() => Number) // query params arrive as strings
  page: number = 1;

  @IsOptional()
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Min(1, { message: 'Limit must be 1 or more' })
  @IsInt({ message: 'Limit must be a valid integer' })
  @Type(() => Number)
  limit: number = 10;

  // search (name, email, employee code)
  @IsOptional()
  @MaxLength(100)
  @IsString()
  @Transform(trim)
  search?: string;

  // sorting
  @IsOptional()
  @IsEnum(SortField, {
    message: `sortBy must be one of: ${Object.values(SortField).join(', ')}`,
  })
  sortBy: SortField = SortField.ID;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'order must be ASC or DESC' })
  @Transform(toUpper)
  order: SortOrder = SortOrder.ASC;

  // filters
  @IsOptional()
  @IsEnum(Department, {
    message: `Department must be one of: ${Object.values(Department).join(', ')}`,
  })
  @Transform(toLower)
  department?: Department;

  @IsOptional()
  @IsString()
  @Transform(toLower)
  designation?: string;

  @IsOptional()
  @IsEnum(EmploymentType, {
    message: `Employment type must be one of: ${Object.values(EmploymentType).join(', ')}`,
  })
  @Transform(toLower)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(EmploymentStatus, {
    message: `Employment status must be one of: ${Object.values(EmploymentStatus).join(', ')}`,
  })
  @Transform(toLower)
  employmentStatus?: EmploymentStatus;

  // joining date range
  @IsOptional()
  @IsDateString({}, { message: 'joinedFrom must be a valid date (YYYY-MM-DD)' })
  joinedFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'joinedTo must be a valid date (YYYY-MM-DD)' })
  joinedTill?: string;
}
