import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerEnumType } from '@nestjs/graphql';

import { Doctor } from '../../schema/doctor.entity';
import { User } from '../../schema/user.entity';
import { VerificationStatus } from '../../common/enum/verification-status.enum';
import { DoctorService } from './doctor.service';
import { DoctorResolver } from './doctor.resolver';

registerEnumType(VerificationStatus, {
  name: 'VerificationStatus',
});

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, User])],
  providers: [DoctorResolver, DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
