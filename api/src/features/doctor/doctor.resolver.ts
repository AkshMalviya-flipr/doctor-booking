import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DoctorService } from './doctor.service';
import { UpsertDoctorInput } from './dto/upsert-doctor.input';
import { DoctorDetail, DoctorDetailResponse } from './entity/doctor-detail.entity';

@Resolver()
export class DoctorResolver {
  constructor(private readonly doctorService: DoctorService) {}

  @Mutation(() => DoctorDetail)
  async upsertDoctorDetail(
    @Args('input') input: UpsertDoctorInput,
  ): Promise<DoctorDetail> {
    return this.doctorService.upsertDoctorDetail(input);
  }

  @Query(() => DoctorDetailResponse)
  async getDoctorDetail(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<DoctorDetailResponse> {
    return this.doctorService.getDoctorDetailByUserId(userId);
  }
}
