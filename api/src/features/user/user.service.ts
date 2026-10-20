import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    BadRequestException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';

import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { User } from '../../schemas/user.schema';
import { SuccessResponse } from './entity/success-response.entity';
import { setAuthTokenCookie } from '../../utils/cookie/cookie.util';
import { handleServiceError } from '../../utils/error/error.util';
import { UserProfile } from './entity/user-profile.entity';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User)
        private readonly userModel: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async signup(input: SignupInput, res: Response): Promise<SuccessResponse> {
        try {
            if (!input.password) {
                throw new BadRequestException('Password is required');
            }

            const existingUser = await this.userModel.findOne({
                where: [{ email: input.email }, { phone: input.phone }],
            });

            if (existingUser) {
                if (existingUser.email === input.email) {
                    throw new ConflictException('Email already in use');
                }
                throw new ConflictException('Phone number already registered');
            }

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10) || 10;
            const hashedPassword = await bcrypt.hash(input.password, saltRounds);

            const user = this.userModel.create({
                ...input,
                password: hashedPassword,
            });

            const savedUser = await this.userModel.save(user);
            setAuthTokenCookie(res, savedUser, this.jwtService);

            return {
                success: true,
                message: 'User registered successfully',
            };
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Signup failed unexpectedly');
        }
    }

    async login(input: LoginInput, res: Response): Promise<SuccessResponse> {
        try {
            if (!input.password) {
                throw new BadRequestException('Password is required');
            }

            const user = await this.userModel.findOne({
                where: { email: input.email },
            });

            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const isMatch = await bcrypt.compare(input.password, user.password);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid credentials');
            }

            setAuthTokenCookie(res, user, this.jwtService);

            return {
                success: true,
                message: 'Logged in successfully',
            };
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Login failed unexpectedly');
        }
    }

    async logout(res: Response): Promise<SuccessResponse> {
        try {
            const cookieName = process.env.JWT_COOKIE_NAME || 'jwt_access_token';
            res.clearCookie(cookieName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });

            return {
                success: true,
                message: 'Logged out successfully',
            };
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Logout failed unexpectedly');
        }
    }

    async getUserById(id: string): Promise<UserProfile> {
        try {
            const user = await this.userModel.findOne({
                where: { id },
                select: {
                    first_name: true,
                    middle_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                },
            });

            if (!user) {
                throw new NotFoundException(`User with ID "${id}" not found`);
            }

            return {
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
            };
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Failed to fetch user');
        }
    }
}