import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorResolver } from './doctor.resolver';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [DoctorResolver, DoctorService],
})
export class DoctorModule {}
