import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  Length,
} from 'class-validator';
import { Gender, Religion, Faculty } from '@prisma/client';

export class CreateCandidateDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  @IsString({ message: 'Phone number must be a string' })
  @Length(8, 14, {
    message: 'Phone number must be between 8 and 14 characters long',
  })
  no_telp: string;

  @IsEnum(Gender)
  jenis_kelamin: Gender;

  @IsEnum(Religion)
  agama: Religion;

  @IsString()
  @IsNotEmpty()
  nim: string;

  @IsString()
  @IsNotEmpty()
  prodi: string;

  @IsEnum(Faculty)
  fakultas: Faculty;

  @IsString()
  @IsNotEmpty()
  angkatan: string;

  @IsOptional()
  @IsString()
  image?: string;
  
  
}
