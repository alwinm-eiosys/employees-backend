import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({type:'int'})
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72) // bcrypt ignores anything past 72 bytes
  password: string;
}
