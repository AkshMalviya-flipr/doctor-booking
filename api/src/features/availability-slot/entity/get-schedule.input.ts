import { InputType, Field, PickType } from '@nestjs/graphql';
import { IsOptional, IsDateString } from 'class-validator';
import { DoctorSchedule } from '../../../schemas/doctor-schedule.schema';

@InputType()
export class GetScheduleFilterInput extends PickType(
    DoctorSchedule,
    ['doctor_id'] as const,
    InputType,
) {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsDateString()
    end_date?: string;
}