// dto/create-prescription.input.ts
import { InputType, OmitType, Field } from '@nestjs/graphql';

import { CreatePrescriptionMedicationInput } from './create-prescription-medication.input';
import { IsOptional, ValidateNested } from 'class-validator';
import { Prescription } from '../../../schemas/prescription.schema';

@InputType()
export class CreatePrescriptionInput extends OmitType(
    Prescription,
    [
        'id',
        'created_at',
        'consultation',
        'doctor',
        'patient',
        'medications',
    ] as const,
    InputType,
) {
    @Field(() => [CreatePrescriptionMedicationInput], { nullable: true })
    @IsOptional()
    @ValidateNested({ each: true })
    medications?: CreatePrescriptionMedicationInput[];
}