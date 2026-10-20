import { CreateHealthInput } from './create-health.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateHealthInput extends PartialType(CreateHealthInput) {
  @Field(() => Int)
  id: number;
}
