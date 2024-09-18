import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserseDto } from './create-users.dto';

export class UpdateUserseDto extends PartialType(
  OmitType(CreateUserseDto, ['password'] as const)
) {}
