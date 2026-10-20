import { InputType, Field, PickType } from '@nestjs/graphql';
import { IsArray, IsDateString } from 'class-validator';
import { DoctorSchedule } from '../../../schemas/doctor-schedule.schema';

@InputType()
export class DeleteScheduleInput extends PickType(
    DoctorSchedule,
    ['doctor_id'] as const,
    InputType,
) {
    @Field(() => [String])
    @IsArray()
    @IsDateString({}, { each: true })
    dates: string[];
}