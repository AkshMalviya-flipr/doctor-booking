import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateHealthInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
