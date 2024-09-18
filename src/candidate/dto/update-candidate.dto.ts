import { PartialType } from '@nestjs/mapped-types';
import { CreateCandidateDto } from './create-candidate.dto';
import { IsOptional } from 'class-validator';

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {
  
  @IsOptional()
  lk1?: number;
  
  @IsOptional()
  lk2?: number;

  @IsOptional()
  sc?: number;
  
  @IsOptional()  
  keaktifan?: number;
}
