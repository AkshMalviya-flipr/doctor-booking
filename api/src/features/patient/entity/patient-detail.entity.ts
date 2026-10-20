import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { Patient } from '../../../schemas/patient.schema';
import { UserProfile } from '../../user/entity/user-profile.entity';

@ObjectType('PatientDetail')
export class PatientDetail extends OmitType(
    Patient,
    ['created_at', 'updated_at'] as const,
    ObjectType,
) { }

@ObjectType('PatientDetailResponse')
export class PatientDetailResponse {
    @Field(() => PatientDetail)
    patient: PatientDetail;

    @Field(() => UserProfile)
    user: UserProfile;
}