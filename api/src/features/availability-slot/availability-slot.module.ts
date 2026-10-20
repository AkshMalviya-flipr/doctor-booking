import { Module } from '@nestjs/common';
import { AvailabilitySlotService } from './availability-slot.service';
import { AvailabilitySlotResolver } from './availability-slot.resolver';

@Module({
  providers: [AvailabilitySlotResolver, AvailabilitySlotService],
})
export class AvailabilitySlotModule {}
