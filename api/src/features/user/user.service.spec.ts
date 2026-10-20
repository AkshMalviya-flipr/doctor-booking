import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from '../../schemas/user.schema';
import { UserRole } from '../../common/enum/role.enum';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import * as cookieUtil from '../../utils/cookie/cookie.util';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupData: SignupInput = {
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'StrongPassword123!',
      role: UserRole.PATIENT,
    };

    it('should throw BadRequestException if password is missing', async () => {
      const inputWithoutPassword: SignupInput = {
        email: signupData.email,
        phone: signupData.phone,
        password: '',
        role: signupData.role,
      };

      await expect(
        service.signup(inputWithoutPassword, mockResponse as Response),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email is already in use', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'user-id-1',
        email: signupData.email,
        phone: 'different-phone',
      } as User);

      await expect(
        service.signup(signupData, mockResponse as Response),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.signup(signupData, mockResponse as Response),
      ).rejects.toThrow('Email already in use');
    });

    it('should throw ConflictException if phone number is already registered', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'user-id-2',
        email: 'different-email@example.com',
        phone: signupData.phone,
      } as User);

      await expect(
        service.signup(signupData, mockResponse as Response),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.signup(signupData, mockResponse as Response),
      ).rejects.toThrow('Phone number already registered');
    });

    it('should hash password, create user, save, set auth cookie, and return success', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const hashedPassword = 'hashed_password_mock';
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => hashedPassword);

      const createdUser = {
        email: signupData.email,
        phone: signupData.phone,
        role: signupData.role,
        password: hashedPassword,
      };
      const savedUser = {
        id: 'generated-uuid',
        ...createdUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(savedUser);

      const setAuthTokenCookieSpy = jest.spyOn(cookieUtil, 'setAuthTokenCookie');

      const result = await service.signup(signupData, mockResponse as Response);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: signupData.email }, { phone: signupData.phone }],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        signupData.password,
        expect.any(Number),
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        email: signupData.email,
        phone: signupData.phone,
        role: signupData.role,
        password: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
      expect(setAuthTokenCookieSpy).toHaveBeenCalledWith(
        mockResponse,
        savedUser,
        jwtService,
      );
      expect(result).toEqual({
        success: true,
        message: 'User registered successfully',
      });
    });

    it('should throw InternalServerErrorException if database fails unexpectedly', async () => {
      userRepository.findOne.mockRejectedValue(new Error('DB connection failure'));

      await expect(
        service.signup(signupData, mockResponse as Response),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw BadRequestException if password is missing', async () => {
      const inputWithoutPassword: LoginInput = {
        email: 'test@example.com',
        password: '',
      };

      await expect(
        service.login(inputWithoutPassword, mockResponse as Response),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login(loginInput, mockResponse as Response),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login(loginInput, mockResponse as Response),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: loginInput.email,
        password: 'hashed-password',
      } as User);

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login(loginInput, mockResponse as Response),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login(loginInput, mockResponse as Response),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should set auth cookie and return success on valid credentials', async () => {
      const mockUser = {
        id: 'uuid-1',
        email: loginInput.email,
        password: 'hashed-password',
        role: UserRole.PATIENT,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      const setAuthTokenCookieSpy = jest.spyOn(cookieUtil, 'setAuthTokenCookie');

      const result = await service.login(loginInput, mockResponse as Response);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password,
      );
      expect(setAuthTokenCookieSpy).toHaveBeenCalledWith(
        mockResponse,
        mockUser,
        jwtService,
      );
      expect(result).toEqual({
        success: true,
        message: 'Logged in successfully',
      });
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      userRepository.findOne.mockRejectedValue(new Error('Unexpected error'));

      await expect(
        service.login(loginInput, mockResponse as Response),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('logout', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should clear cookie with default name and return success in non-production', async () => {
      delete process.env.JWT_COOKIE_NAME;
      process.env.NODE_ENV = 'development';

      const result = await service.logout(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt_access_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
      });
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should use custom cookie name and secure: true in production', async () => {
      process.env.JWT_COOKIE_NAME = 'custom_jwt';
      process.env.NODE_ENV = 'production';

      const result = await service.logout(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('custom_jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle unexpected errors during logout', async () => {
      const responseWithError = {
        clearCookie: jest.fn().mockImplementation(() => {
          throw new Error('Cookie clear error');
        }),
      } as unknown as Response;

      await expect(service.logout(responseWithError)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
