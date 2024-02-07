// user.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSchema } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { RegisterUserDto } from '../../dto/user.dto';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';
import { JwtAuthService } from '../jwt/jwt.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
    let authService: AuthService;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                AuthService,
                Repository,
                JwtAuthService,
                JwtService,
                {
                    provide: getRepositoryToken(UserSchema),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);

    });

    describe('Register User', () => {
        const mockRegisterUserData = {
            name: "trung",
            email: "quangtrung@gmail.com",
            password: "trung123",
            identification: 123,
            mobileNumber: "0974078473",
            country: "Viet Nam",
            proofOfIdentity: "identityImages.png",
        };
        const mockUser = {
            id: "30d1151f-f70e-408c-ac93-3733738a2402",
            name: "trung",
            email: "quangtrung@gmail.com",
            password: "trung123",
            identification: 123,
            mobileNumber: "0974078473",
            country: "Viet Nam",
            proofOfIdentity: "identityImages.png",
        };

        it('should announce that password is not strong enough', async () => {
            jest.spyOn(authService, 'register').mockImplementation();
            const ofImportDto = plainToInstance(RegisterUserDto, mockRegisterUserData)
            const errors = await validate(ofImportDto)
            expect(errors[0].constraints['isStrongPassword']).toBe('password is not strong enough');
        })

        it('should register a new user', async () => {

            jest.spyOn(userService, 'getUserByEmail').mockResolvedValue(null);
            jest.spyOn(userService, 'createUser').mockResolvedValue(mockUser);

            const result = await authService.register(mockRegisterUserData);
            expect(result).toEqual(mockUser);
        });

        it('should handle user already exists', async () => {

            jest.spyOn(userService, 'getUserByEmail').mockResolvedValue(mockUser);
            await expect(authService.register(mockRegisterUserData)).rejects.toThrow('User already exists');
        });

        it('should handle bcrypt hash error', async () => {

            jest.spyOn(userService, 'getUserByEmail').mockResolvedValue(null);
            jest.spyOn(bcrypt, 'hash').mockImplementation(() => null);

            await expect(authService.register(mockRegisterUserData)).rejects.toThrow('Bcrypt hash error');
        });
    });
});
