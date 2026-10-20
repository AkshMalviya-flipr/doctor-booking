import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { Public } from '../../common/decorator/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorator/current-user.decorator';
import { extractTokenFromRequest } from '../../utils/cookie/cookie.util';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './entities/auth-response.entity';
import { LogoutResponse } from './entities/logout-response.entity';
import { UserEntity } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * REST endpoint: Sign up a new user.
   * POST /auth/signup
   */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.authService.signup(signupDto, res);
  }

  /**
   * REST endpoint: Log in existing user.
   * POST /auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.authService.login(loginDto, res);
  }

  /**
   * REST endpoint: Log out current user session.
   * POST /auth/logout
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponse> {
    return this.authService.logout(res);
  }

  /**
   * REST endpoint: Get currently authenticated user.
   * GET /auth/me
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(
    @CurrentUser() user: JwtPayload | undefined,
    @Req() req: Request,
  ): Promise<UserEntity> {
    let userId = user?.sub;

    if (!userId && req) {
      const token = extractTokenFromRequest(req);
      if (token) {
        try {
          const decoded = this.jwtService.verify<JwtPayload>(token, {
            secret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-development-change-in-prod',
          });
          userId = decoded.sub;
        } catch {
          throw new UnauthorizedException('Authentication token is invalid or expired');
        }
      }
    }

    if (!userId) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }

    return this.authService.me(userId);
  }
}
