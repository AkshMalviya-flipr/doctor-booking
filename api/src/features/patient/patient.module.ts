import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { PatientResolver } from './patient.resolver';
import { PatientService } from './patient.service';

@Module({
  imports: [UserModule],
  providers: [PatientResolver, PatientService],
  exports: [PatientService],
})
export class PatientModule { }
