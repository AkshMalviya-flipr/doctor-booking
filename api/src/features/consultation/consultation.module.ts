import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Consultation } from '../../schema/consultation.entity';
import { Doctor } from '../../schema/doctor.entity';
import { User } from '../../schema/user.entity';
import { AvailabilitySlot } from '../../schema/availability_slot.entity';
import { ConsultationService } from './consultation.service';
import { ConsultationResolver } from './consultation.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, Doctor, User, AvailabilitySlot]),
  ],
  providers: [ConsultationResolver, ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule {}
