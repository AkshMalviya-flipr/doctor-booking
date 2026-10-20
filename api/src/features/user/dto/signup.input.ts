import { InputType, Field, OmitType } from '@nestjs/graphql';
import { IsNotEmpty, MinLength } from 'class-validator';
import { User } from '../../../schemas/user.schema';

@InputType()
export class SignupInput extends OmitType(
    User,
    ['id', 'createdAt', 'updatedAt'] as const,
    InputType,
) {
    @Field(() => String)
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}