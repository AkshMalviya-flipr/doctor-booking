import { InputType, OmitType } from '@nestjs/graphql';
import { PrescriptionMedication } from '../../../schemas/prescription-medication.schema';

@InputType()
export class CreatePrescriptionMedicationInput extends OmitType(
    PrescriptionMedication,
    ['id', 'prescription_id', 'prescription'] as const,
    InputType,
) { }