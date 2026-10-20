// src/features/availability/availability-slot.resolver.ts

import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { DoctorSchedule } from '../../schemas/doctor-schedule.schema';
import { AvailabilitySlotService } from './availability-slot.service';
import { UpsertScheduleInput } from './dto/upsert-schedule.input';
import { DeleteScheduleInput } from './dto/delete-schedule.input';
import { GetScheduleFilterInput } from './entity/get-schedule.input';


@Resolver(() => DoctorSchedule)
export class AvailabilitySlotResolver {
  constructor(private readonly availabilityService: AvailabilitySlotService) { }

  @Mutation(() => [DoctorSchedule], { name: 'upsertDoctorSchedule' })
  async upsertDoctorSchedule(
    @Args('input') input: UpsertScheduleInput,
  ): Promise<DoctorSchedule[]> {
    return this.availabilityService.upsertScheduleAndSlots(input);
  }

  @Mutation(() => Boolean, { name: 'deleteDoctorSchedules' })
  async deleteDoctorSchedules(
    @Args('input') input: DeleteScheduleInput,
  ): Promise<boolean> {
    return this.availabilityService.deleteSchedules(input);
  }

  @Query(() => [DoctorSchedule], { name: 'getDoctorSchedules' })
  async getDoctorSchedules(
    @Args('filter') filter: GetScheduleFilterInput,
  ): Promise<DoctorSchedule[]> {
    return this.availabilityService.getDoctorSchedules(filter);
  }
}