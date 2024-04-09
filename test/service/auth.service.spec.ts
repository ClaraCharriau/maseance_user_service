import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
const bcrypt = require('bcrypt');
import { VerifyResponseDto } from 'src/auth/dto/verifyResponse.dto';
import { AuthService } from '../../src/auth/auth.service';
import { UserService } from '../../src/user/user.service';
import * as mockUser from '../mocks/user_200.json';
import { UpdateUserDto } from 'src/user/dto/updateUser.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findUserByEmail: jest.fn(),
            existsByEmail: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            findUserById: jest.fn()
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('fakeAccessToken'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  it('should return an access token when valid email and password are provided', async () => {
    // Given
    const email = 'test@example.com';
    const password = 'password123';
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
    jest.spyOn(userService, 'findUserByEmail').mockResolvedValueOnce(mockUser);

    // When
    const result = await authService.logIn(email, password);

    // Then
    expect(result.access_token).toEqual('fakeAccessToken');
  });

  it('should throw UnauthorizedException when invalid password is provided', async () => {
    // Given
    const email = 'test@example.com';
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    // When then
    await expect(authService.logIn(email, 'wrongpassword')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return true when user with given email exists', async () => {
    // Given
    const email = 'test@example.com';
    jest.spyOn(userService, 'existsByEmail').mockResolvedValueOnce(true);

    // When
    const result: VerifyResponseDto = await authService.verify(email);

    // Then
    expect(result.isExistingAccount).toBe(true);
  });

  it('should return false when user with given email does not exist', async () => {
    // Given
    const email = 'nonexistent@example.com';
    jest.spyOn(userService, 'existsByEmail').mockResolvedValueOnce(false);

    // When
    const result: VerifyResponseDto = await authService.verify(email);

    // Then
    expect(result.isExistingAccount).toBe(false);
  });

  it('should throw BadRequestException if email is not provided', async () => {
    await expect(authService.verify('')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if user with given email already exists', async () => {
    const email = 'test@example.com';
    jest.spyOn(userService, 'existsByEmail').mockResolvedValueOnce(true);

    await expect(authService.signIn(email, 'test', 'password')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create a new user and return it if user with given email does not exist', async () => {
    const email = 'test@example.com';
    const id = 'e047bda3-b2fa-418b-adb6-c0cfaad7b18b';
    jest.spyOn(userService, 'existsByEmail').mockResolvedValueOnce(false);
    jest.spyOn(userService, 'createUser').mockResolvedValueOnce({
      id,
      email,
      pseudo: 'test',
      password: 'hashPass',
    });

    const result = await authService.signIn(email, 'test', 'password');

    expect(result).toEqual({
      id: 'e047bda3-b2fa-418b-adb6-c0cfaad7b18b',
      email,
      pseudo: 'test',
      password: 'hashPass',
    });
  });

  it('should update an user', async () => {
    const email = 'test@example.com';
    const id = 'e047bda3-b2fa-418b-adb6-c0cfaad7b18b';
    const updateUserDto: UpdateUserDto = {
      id,
      email: 'test@example.com',
      pseudo: 'newPseudo',
      password: 'newPassword',
    }
    const updatedUser: UpdateUserDto = {
      id,
      email: 'test@example.com',
      pseudo: 'newPseudo',
      password: 'hashPass',
    }
    const updateUserSpy = jest.spyOn(userService, 'updateUser');
    jest.spyOn(userService, 'findUserById').mockResolvedValueOnce(updatedUser);
    

    const result = await authService.updateUser(id, updateUserDto);

    expect(result).toEqual({
      id: 'e047bda3-b2fa-418b-adb6-c0cfaad7b18b',
      email,
      pseudo: 'newPseudo',
      password: 'hashPass',
    });
    expect(updateUserSpy).toHaveBeenCalled();
  });
});
