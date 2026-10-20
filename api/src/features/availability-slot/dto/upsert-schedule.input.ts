// src/features/availability/dto/upsert-schedule.input.ts

import { InputType, Field, Int, OmitType } from '@nestjs/graphql';
import { IsArray, IsDateString, IsInt, Matches, Min } from 'class-validator';
import { DoctorSchedule } from '../../../schemas/doctor-schedule.schema';

@InputType()
export class UpsertScheduleInput extends OmitType(
    DoctorSchedule,
    ['id', 'date', 'slots', 'created_at', 'updated_at'] as const,
    InputType,
) {
    @Field(() => [String])
    @IsArray()
    @IsDateString({}, { each: true })
    dates: string[];

    @Field(() => String)
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'start_time must be in HH:mm format',
    })
    start_time: string;

    @Field(() => String)
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'end_time must be in HH:mm format',
    })
    end_time: string;

    @Field(() => Int)
    @IsInt()
    @Min(5)
    duration_minutes: number;
}