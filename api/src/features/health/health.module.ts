import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthResolver } from './health.resolver';

@Module({
  providers: [HealthResolver, HealthService],
})
export class HealthModule {}
