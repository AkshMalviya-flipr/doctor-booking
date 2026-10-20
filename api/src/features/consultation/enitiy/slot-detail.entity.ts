import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { DoctorSlot } from '../../../schemas/doctor-slot.schema';
import { Consultation } from '../../../schemas/consultation.schema';

@ObjectType()
export class SlotDetailEntity {
    @Field(() => DoctorSlot)
    slot: DoctorSlot;

    @Field(() => Consultation, { nullable: true })
    consultation?: Consultation;
}

export type SlotDetail = SlotDetailEntity;

@InputType()
export class SlotDetailInput {
    @Field(() => DoctorSlot)
    slot: DoctorSlot;

    @Field(() => Consultation, { nullable: true })
    consultation?: Consultation;
}
