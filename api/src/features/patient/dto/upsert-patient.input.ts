import { InputType, OmitType } from '@nestjs/graphql';
import { Patient } from '../../../schemas/patient.schema';

@InputType()
export class UpsertPatientInput extends OmitType(
    Patient,
    ['id', 'created_at', 'updated_at'] as const,
    InputType,
) { }