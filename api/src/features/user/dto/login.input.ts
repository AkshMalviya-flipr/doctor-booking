import { InputType, PickType } from '@nestjs/graphql';
import { User } from '../../../schemas/user.schema';

@InputType()
export class LoginInput extends PickType(
    User,
    ['email', 'password'] as const,
    InputType,
) { }