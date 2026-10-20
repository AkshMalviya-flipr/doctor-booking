import { Test, TestingModule } from '@nestjs/testing';
import { PatientResolver } from './patient.resolver';
import { PatientService } from './patient.service';

describe('PatientResolver', () => {
  let resolver: PatientResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientResolver, PatientService],
    }).compile();

    resolver = module.get<PatientResolver>(PatientResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
