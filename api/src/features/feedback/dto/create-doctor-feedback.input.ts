// dto/create-doctor-feedback.input.ts
import { InputType, OmitType, Field, Int } from '@nestjs/graphql';

import { IsUUID, IsOptional, IsString, Min, Max } from 'class-validator';
import { DoctorFeedback } from '../../../schemas/feedback.schema';

@InputType()
export class CreateDoctorFeedbackInput extends OmitType(
    DoctorFeedback,
    ['id', 'created_at'] as const,
    InputType,
) {
    @Field(() => String)
    @IsUUID()
    doctor_id: string;

    @Field(() => String)
    @IsUUID()
    patient_id: string;

    @Field(() => String)
    @IsUUID()
    consultancy_id: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUUID()
    prescription_id?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    feedback?: string;

    @Field(() => Int)
    @Min(1)
    @Max(5)
    rating: number;
}