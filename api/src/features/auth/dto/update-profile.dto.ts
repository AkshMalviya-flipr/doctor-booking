import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { SignupDto } from './signup.dto';

@InputType({ description: 'Input payload for updating user profile' })
export class UpdateProfileDto extends PartialType(
  OmitType(SignupDto, ['password', 'role'] as const),
) {}
