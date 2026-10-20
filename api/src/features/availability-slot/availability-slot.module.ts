import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AvailabilitySlot } from '../../schema/availability_slot.entity';
import { Doctor } from '../../schema/doctor.entity';
import { Consultation } from '../../schema/consultation.entity';
import { AvailabilitySlotService } from './availability-slot.service';
import { AvailabilitySlotResolver } from './availability-slot.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvailabilitySlot, Doctor, Consultation]),
  ],
  providers: [AvailabilitySlotResolver, AvailabilitySlotService],
  exports: [AvailabilitySlotService],
})
export class AvailabilitySlotModule {}
