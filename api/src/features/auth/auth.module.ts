import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../../schema/user.entity';
import { Profile } from '../../schema/profile.entity';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

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
