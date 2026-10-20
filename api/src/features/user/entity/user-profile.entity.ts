import { ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../../../schemas/user.schema';

@ObjectType('UserProfile')
export class UserProfile extends PickType(
    User,
    ['first_name', 'middle_name', 'last_name', 'email', 'phone'] as const,
    ObjectType,
) { }