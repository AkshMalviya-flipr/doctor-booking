import { InputType, OmitType } from '@nestjs/graphql';
import { Doctor } from '../../../schemas/doctor.schema';

@InputType()
export class UpsertDoctorInput extends OmitType(
  Doctor,
  ['id', 'created_at', 'updated_at', 'is_verified'] as const,
  InputType,
) {}
