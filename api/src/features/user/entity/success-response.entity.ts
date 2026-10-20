import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType('SuccessResponse')
export class SuccessResponse {
    @Field(() => Boolean)
    success: boolean;

    @Field(() => String)
    message: string;
}