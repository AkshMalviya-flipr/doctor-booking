import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Doctor } from '../../schema/doctor.entity';
import { User } from '../../schema/user.entity';
import { DoctorService } from './doctor.service';
import { DoctorResolver } from './doctor.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, User])],
  providers: [DoctorResolver, DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
