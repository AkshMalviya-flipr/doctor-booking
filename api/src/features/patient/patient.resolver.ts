import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { PatientService } from './patient.service';
import { UpsertPatientInput } from './dto/upsert-patient.input';
import { PatientDetail, PatientDetailResponse } from './entity/patient-detail.entity';

@Resolver(() => PatientDetailResponse)
export class PatientResolver {
  constructor(private readonly patientService: PatientService) { }

  @Mutation(() => PatientDetail)
  async upsertPatientDetail(
    @Args('input') input: UpsertPatientInput,
  ): Promise<PatientDetail> {
    return this.patientService.upsertPatientDetail(input);
  }

  @Query(() => PatientDetailResponse)
  async getPatientDetail(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<PatientDetailResponse> {
    return this.patientService.getPatientDetailByUserId(userId);
  }
}