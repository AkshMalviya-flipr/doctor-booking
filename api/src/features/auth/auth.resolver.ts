import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { Public } from '../../common/decorator/public.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorator/current-user.decorator';
import { extractTokenFromRequest } from '../../utils/cookie/cookie.util';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './entities/auth-response.entity';
import { LogoutResponse } from './entities/logout-response.entity';
import { UserEntity } from './entities/user.entity';

@Resolver(() => UserEntity)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Mutation(() => AuthResponse)
  async signup(
    @Args('signupInput') signupDto: SignupDto,
    @Context() context: { req: Request; res: Response },
  ): Promise<AuthResponse> {
    return this.authService.signup(signupDto, context?.res);
  }

  @Public()
  @Mutation(() => AuthResponse)
  async login(
    @Args('loginInput') loginDto: LoginDto,
    @Context() context: { req: Request; res: Response },
  ): Promise<AuthResponse> {
    return this.authService.login(loginDto, context?.res);
  }

  @Public()
  @Mutation(() => LogoutResponse)
  async logout(
    @Context() context: { req: Request; res: Response },
  ): Promise<LogoutResponse> {
    return this.authService.logout(context?.res);
  }

  @Query(() => UserEntity)
  async me(
    @CurrentUser() user: JwtPayload | undefined,
    @Context() context: { req: Request; res: Response },
  ): Promise<UserEntity> {
    let userId = user?.sub;

    // Fallback: If middleware didn't populate user, decode token from request
    if (!userId && context?.req) {
      const token = extractTokenFromRequest(context.req);
      if (token) {
        try {
          const decoded = this.jwtService.verify<JwtPayload>(token, {
            secret:
              process.env.JWT_SECRET ||
              'super-secret-jwt-key-for-development-change-in-prod',
          });
          userId = decoded.sub;
        } catch {
          throw new UnauthorizedException(
            'Authentication token is invalid or expired',
          );
        }
      }
    }

    if (!userId) {
      throw new UnauthorizedException(
        'Authentication credentials were not provided',
      );
    }

    return this.authService.me(userId);
  }
}
