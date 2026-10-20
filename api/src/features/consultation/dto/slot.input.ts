import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SlotInput {
  @Field(() => String)
  slot_id: string;

  @Field(() => String, { nullable: true })
  patient_id?: string;
}
