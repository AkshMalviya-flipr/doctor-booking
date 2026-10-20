import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from '../../schema/payment.entity';
import { Consultation } from '../../schema/consultation.entity';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Consultation])],
  providers: [PaymentResolver, PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
