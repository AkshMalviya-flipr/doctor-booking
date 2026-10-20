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
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';

import { User } from '../../schema/user.entity';
import { Profile } from '../../schema/profile.entity';
import { UserRole } from '../../common/enum/user-role.enum';
import { UserStatus } from '../../common/enum/user-status.enum';
import { handleServiceError } from '../../utils/error/error.util';
import { setAuthTokenCookie, clearAuthTokenCookie } from '../../utils/cookie/cookie.util';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './entities/auth-response.entity';
import { LogoutResponse } from './entities/logout-response.entity';
import { UserEntity } from './entities/user.entity';
import { ProfileEntity } from './entities/profile.entity';

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

  /**
   * Register a new user with credentials and profile details.
   */
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

      // Create initial profile for user
      const newProfile = this.profileRepository.create({
        user_id: savedUser.user_id,
        full_name: signupDto.full_name.trim(),
        phone: signupDto.phone?.trim() || null,
      });

      const savedProfile = await this.profileRepository.save(newProfile);
      savedUser.profile = savedProfile;

      // Generate JWT and set HTTP-only cookie if response object provided
      const token = this.generateToken(savedUser);
      if (res) {
        setAuthTokenCookie(res, savedUser, this.jwtService);
      }

      return {
        success: true,
        message: 'Account created successfully',
        token,
        user: this.mapToUserEntity(savedUser),
      };
    } catch (error) {
      handleServiceError(error, this.logger, 'AuthService.signup');
    }
  }

  /**
   * Authenticate existing user with email and password.
   */
  async login(loginDto: LoginDto, res?: Response): Promise<AuthResponse> {
    try {
      const normalizedEmail = loginDto.email.trim().toLowerCase();

      // Find user by email including associated profile
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
        relations: ['profile'],
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException(
          'Your account has been suspended. Please contact customer support.',
        );
      }

      if (user.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException(
          'Your account is currently inactive.',
        );
      }

      // Verify password hash
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Update last login timestamp
      user.last_login_at = new Date();
      await this.userRepository.save(user);

      // Generate JWT and set auth cookie if response object provided
      const token = this.generateToken(user);
      if (res) {
        setAuthTokenCookie(res, user, this.jwtService);
      }

      return {
        success: true,
        message: 'Logged in successfully',
        token,
        user: this.mapToUserEntity(user),
      };
    } catch (error) {
      handleServiceError(error, this.logger, 'AuthService.login');
    }
  }

  /**
   * Log out user and invalidate cookie.
   */
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

  /**
   * Fetch currently authenticated user's profile.
   */
  async me(userId: string): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['profile'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.mapToUserEntity(user);
    } catch (error) {
      handleServiceError(error, this.logger, 'AuthService.me');
    }
  }

  /**
   * Helper: Generate JWT access token for user.
   */
  private generateToken(user: User): string {
    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Helper: Map TypeORM User entity to GraphQL UserEntity.
   */
  private mapToUserEntity(user: User): UserEntity {
    let profileEntity: ProfileEntity | null = null;

    if (user.profile) {
      profileEntity = {
        profile_id: user.profile.profile_id,
        user_id: user.profile.user_id,
        full_name: user.profile.full_name,
        date_of_birth: user.profile.date_of_birth,
        gender: user.profile.gender,
        phone: user.profile.phone,
        address: user.profile.address,
        profile_image_url: user.profile.profile_image_url,
        created_at: user.profile.created_at,
        updated_at: user.profile.updated_at,
      };
    }

    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      status: user.status,
      email_verified: user.email_verified,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: profileEntity,
    };
  }
}
