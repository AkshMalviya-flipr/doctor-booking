import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { Doctor } from '../../../schemas/doctor.schema';
import { UserProfile } from '../../user/entity/user-profile.entity';

@ObjectType('DoctorDetail')
export class DoctorDetail extends OmitType(
  Doctor,
  ['created_at', 'updated_at'] as const,
  ObjectType,
) {}

@ObjectType('DoctorDetailResponse')
export class DoctorDetailResponse {
  @Field(() => DoctorDetail)
  doctor: DoctorDetail;

  @Field(() => UserProfile)
  user: UserProfile;
}
