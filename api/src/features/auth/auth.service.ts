import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';

import { User } from '../../schema/user.entity';
import { Profile } from '../../schema/profile.entity';
import { UserRole } from '../../common/enum/user-role.enum';
import { UserStatus } from '../../common/enum/user-status.enum';
import { handleServiceError } from '../../utils/error/error.util';
import {
  setAuthTokenCookie,
  clearAuthTokenCookie,
  extractTokenFromRequest,
} from '../../utils/cookie/cookie.util';
import { JwtPayload } from '../../common/decorator/current-user.decorator';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './entities/auth-response.entity';
import { LogoutResponse } from './entities/logout-response.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto, res?: Response): Promise<AuthResponse> {
    try {
      const normalizedEmail = signupDto.email.trim().toLowerCase();

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new ConflictException(
          'A user with this email address already exists',
        );
      }

      // Hash user password with bcrypt
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(signupDto.password, saltRounds);

      // Create new user record
      const newUser = this.userRepository.create({
        email: normalizedEmail,
        password_hash,
        role: signupDto.role || UserRole.PATIENT,
        status: UserStatus.ACTIVE,
        email_verified: false,
      });

      const savedUser = await this.userRepository.save(newUser);

      const newProfile = this.profileRepository.create({
        user_id: savedUser.user_id,
        full_name: signupDto.full_name.trim(),
        phone: signupDto.phone?.trim() || null,
      });

      await this.profileRepository.save(newProfile);

      const token = this.generateToken(savedUser);
      if (res) {
        setAuthTokenCookie(res, savedUser, this.jwtService);
      }

      return {
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          user_id: savedUser.user_id,
          email: savedUser.email,
          role: savedUser.role,
          status: savedUser.status,
          email_verified: savedUser.email_verified,
          created_at: savedUser.created_at,
          updated_at: savedUser.updated_at,
        } as any,
      };
    } catch (error) {
      handleServiceError(error, this.logger, 'AuthService.signup');
    }
  }

  async login(loginDto: LoginDto, res?: Response): Promise<AuthResponse> {
    try {
      const normalizedEmail = loginDto.email.trim().toLowerCase();

      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException(
          'Your account has been suspended. Please contact customer support.',
        );
      }

      if (user.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException('Your account is currently inactive.');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      user.last_login_at = new Date();
      await this.userRepository.save(user);

      const token = this.generateToken(user);
      if (res) {
        setAuthTokenCookie(res, user, this.jwtService);
      }

      return {
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          status: user.status,
          email_verified: user.email_verified,
          created_at: user.created_at,
          updated_at: user.updated_at,
        } as any,
      };
    } catch (error) {
      handleServiceError(error, this.logger, 'AuthService.login');
    }
  }

  async logout(res?: Response): Promise<LogoutResponse> {
    try {
      if (res) {
        clearAuthTokenCookie(res);
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      handleServiceError(error, this.logger, 'AuthService.logout');
    }
  }

  async me(user?: JwtPayload, req?: Request): Promise<UserEntity> {
    try {
      let userId = user?.sub;

      if (!userId && req) {
        const token = extractTokenFromRequest(req);
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

      const foundUser = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: { profile: true },
      });

      if (!foundUser) {
        throw new NotFoundException('User not found');
      }

      return {
        user_id: foundUser.user_id,
        email: foundUser.email,
        role: foundUser.role,
        status: foundUser.status,
        email_verified: foundUser.email_verified,
        last_login_at: foundUser.last_login_at,
        created_at: foundUser.created_at,
        updated_at: foundUser.updated_at,
        profile: foundUser.profile
          ? {
              profile_id: foundUser.profile.profile_id,
              user_id: foundUser.profile.user_id,
              full_name: foundUser.profile.full_name,
              date_of_birth: foundUser.profile.date_of_birth,
              gender: foundUser.profile.gender,
              phone: foundUser.profile.phone,
              address: foundUser.profile.address,
              profile_image_url: foundUser.profile.profile_image_url,
              created_at: foundUser.profile.created_at,
              updated_at: foundUser.profile.updated_at,
            }
          : null,
      };
    } catch (error) {
      handleServiceError(error, this.logger, 'AuthService.me');
    }
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
