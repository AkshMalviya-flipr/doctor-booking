import { ObjectType, Field } from '@nestjs/graphql';
import { UserEntity } from './user.entity';

@ObjectType('AuthResponse')
export class AuthResponse {
  @Field(() => Boolean, { description: 'Indicates if the authentication operation was successful' })
  success: boolean;

  @Field(() => String, { description: 'Response message describing the result' })
  message: string;

  @Field(() => String, { nullable: true, description: 'JWT access token issued on successful auth' })
  token?: string | null;

  @Field(() => UserEntity, { nullable: true, description: 'Authenticated user profile details' })
  user?: UserEntity | null;
}
