import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { registerEnumType } from '@nestjs/graphql';

import { User } from '../../schema/user.entity';
import { Profile } from '../../schema/profile.entity';
import { UserRole } from '../../common/enum/user-role.enum';
import { UserStatus } from '../../common/enum/user-status.enum';
import { Gender } from '../../common/enum/gender.enum';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

registerEnumType(UserRole, {
  name: 'UserRole',
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
});

registerEnumType(Gender, {
  name: 'Gender',
});

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    JwtModule.register({
      global: true,
      secret:
        process.env.JWT_SECRET ||
        'super-secret-jwt-key-for-development-change-in-prod',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
      },
    }),
  ],
  providers: [AuthResolver, AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
