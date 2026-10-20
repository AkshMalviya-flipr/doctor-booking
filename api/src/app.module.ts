import 'dotenv/config';
import { APP_GUARD } from '@nestjs/core';
import { PublicApiGuard } from './common/gaurds/public-api.guard';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import helmet from 'helmet';
import cors from 'cors';
import { GraphqlModule } from './core/graphql/graphql.module';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './features/health/health.module';
import { PaginationModule } from './common/pagination/pagination.module';
import { UserModule } from './features/user/user.module';
import { DoctorModule } from './features/doctor/doctor.module';
import { PatientModule } from './features/patient/patient.module';
import { ConsultationModule } from './features/consultation/consultation.module';
import { AvailabilitySlotModule } from './features/availability-slot/availability-slot.module';
import { FeedbackModule } from './features/feedback/feedback.module';
import { PaymentModule } from './features/payment/payment.module';
import { PrescriptionModule } from './features/prescription/prescription.module';

@Module({
  imports: [GraphqlModule, HealthModule, DatabaseModule, PaginationModule, UserModule, DoctorModule, PatientModule, ConsultationModule, AvailabilitySlotModule, FeedbackModule, PaymentModule, PrescriptionModule],
  providers: [{ provide: APP_GUARD, useClass: PublicApiGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(helmet(), cors()).forRoutes('*');
  }
}
