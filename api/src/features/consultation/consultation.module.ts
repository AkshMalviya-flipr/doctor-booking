import { Module } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ConsultationResolver } from './consultation.resolver';

@Module({
  // No need to import TypeOrmModule.forFeature here; entities are registered globally in DatabaseModule.
  providers: [ConsultationResolver, ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule {}
