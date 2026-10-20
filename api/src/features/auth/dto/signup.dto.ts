import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/enum/user-role.enum';
import '../entities/enum.registry';

@InputType()
export class SignupDto {
  @Field(() => String, { description: 'User unique email address' }) // Todo :- remove description
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @Field(() => String, {
    description: 'User password with minimum 6 characters',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @Field(() => String, { description: 'Full name of the user' })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  full_name: string;

  @Field(() => String, { nullable: true, description: 'Optional phone number' })
  @IsOptional()
  @IsString({ message: 'Phone must be a valid string' })
  phone?: string;

  @Field(() => UserRole, {
    nullable: true,
    defaultValue: UserRole.PATIENT,
    description: 'User role: PATIENT, DOCTOR, or ADMIN (defaults to PATIENT)',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be PATIENT, DOCTOR, or ADMIN' })
  role?: UserRole;
}
