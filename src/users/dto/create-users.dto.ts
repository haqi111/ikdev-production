import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  Length,
  MinLength,
} from 'class-validator';
import { Gender, Religion, Faculty , Status} from '@prisma/client';


export class CreateUserseDto {
  @IsString()
  @IsNotEmpty()
  nra: string;

  @IsString()
  @IsNotEmpty()
  nama: string;

  
  @IsString()
  @IsNotEmpty()
  nim: string;

  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  @IsString({ message: 'Phone number must be a string' })
  @Length(8, 14, {
    message: 'Phone number must be between 8 and 14 characters long',
  })
  no_telp: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(Gender)
  jenis_kelamin: Gender;

  @IsEnum(Religion)
  agama: Religion;

  @IsEnum(Faculty)
  fakultas: Faculty;

  @IsString()
  @IsNotEmpty()
  prodi: string;


  @IsString()
  @IsNotEmpty()
  angkatan: string;

  @IsOptional()
  @IsString()
  image?: string;
  
  @IsEnum(Status)
  status: Status;
  
}
