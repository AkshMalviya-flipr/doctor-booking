import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Prescription } from '../../schema/prescription.entity';
import { Consultation } from '../../schema/consultation.entity';
import { PrescriptionService } from './prescription.service';
import { PrescriptionResolver } from './prescription.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, Consultation])],
  providers: [PrescriptionResolver, PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
