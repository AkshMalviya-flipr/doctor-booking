import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { UserRole } from '../../common/enum/role.enum';
import { SuccessResponse } from './entity/success-response.entity';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: {
    signup: jest.Mock;
    login: jest.Mock;
    logout: jest.Mock;
  };
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    userService = {
      signup: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('signup', () => {
    it('should call userService.signup with input and response and return result', async () => {
      const input: SignupInput = {
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Password123!',
        role: UserRole.PATIENT,
      };

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'User registered successfully',
      };

      userService.signup.mockResolvedValue(expectedResponse);

      const result = await resolver.signup(input, mockResponse as Response);

      expect(userService.signup).toHaveBeenCalledWith(
        input,
        mockResponse as Response,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors thrown by userService.signup', async () => {
      const input: SignupInput = {
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Password123!',
        role: UserRole.PATIENT,
      };

      userService.signup.mockRejectedValue(new Error('Signup failed'));

      await expect(
        resolver.signup(input, mockResponse as Response),
      ).rejects.toThrow('Signup failed');
    });
  });

  describe('login', () => {
    it('should call userService.login with input and response and return result', async () => {
      const input: LoginInput = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Logged in successfully',
      };

      userService.login.mockResolvedValue(expectedResponse);

      const result = await resolver.login(input, mockResponse as Response);

      expect(userService.login).toHaveBeenCalledWith(
        input,
        mockResponse as Response,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors thrown by userService.login', async () => {
      const input: LoginInput = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      userService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        resolver.login(input, mockResponse as Response),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call userService.logout with response and return result', async () => {
      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      userService.logout.mockResolvedValue(expectedResponse);

      const result = await resolver.logout(mockResponse as Response);

      expect(userService.logout).toHaveBeenCalledWith(mockResponse as Response);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors thrown by userService.logout', async () => {
      userService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(
        resolver.logout(mockResponse as Response),
      ).rejects.toThrow('Logout failed');
    });
  });
});
