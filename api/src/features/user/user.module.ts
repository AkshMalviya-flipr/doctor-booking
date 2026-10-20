import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_jwt_secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
      },
    }),
  ],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule { }