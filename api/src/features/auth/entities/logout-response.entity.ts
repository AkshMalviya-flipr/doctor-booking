import { ObjectType, OmitType } from '@nestjs/graphql';
import { AuthResponse } from './auth-response.entity';

@ObjectType('LogoutResponse')
export class LogoutResponse extends OmitType(
  AuthResponse,
  ['token', 'user'] as const,
) {}
