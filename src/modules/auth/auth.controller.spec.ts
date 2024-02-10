import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express'
import { ResponseAPI } from '../../utils/responseApi';
import { HttpStatus } from '@nestjs/common';
import { UserSchema } from '../../entities//user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtAuthService } from '../jwt/jwt.service';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';
import { CurrentTokenPair } from '../../entities/currentTokenPair.entity';
import { UsedRefreshTokens } from '../../entities/usedRefreshTokens.entity';

describe('AuthController', () => {

    let authController: AuthController;
    let authService: AuthService;

    const requestMock = {
        params: {
            userId: "30d1151f-f70e-408c-ac93-3733738a2402"
        },
        body: {
            name: "trung",
            email: "quangtrung@gmail.com",
            password: "test123",
            identification: 123,
            mobileNumber: "0974078473",
            country: "Viet Nam",
            proofOfIdentity: "identityImages.png"
        },
        user: {
            id: "30d1151f-f70e-408c-ac93-3733738a2402",
            name: "trung",
            email: "quangtrung@gmail.com",
            password: "test123",
            identificationNumber: 123,
            identificationType: 'citizenId',
            mobileNumber: "0974078473",
            country: "Viet Nam",
            proofOfIdentity: "identityImages.png",
            currentAccounts: null,
            savingsAccounts: null,
        }
    } as unknown as Request;

    const responseMock = {
        status: jest.fn((x) => ({
            json: jest.fn()
        })),
    } as unknown as Response;

    const mockUser = {
        id: "30d1151f-f70e-408c-ac93-3733738a2402",
        name: "trung",
        email: "quangtrung@gmail.com",
        password: "test123",
        identificationNumber: 123,
        identificationType: 'citizenId',
        mobileNumber: "0974078473",
        country: "Viet Nam",
        proofOfIdentity: "identityImages.png",
        currentAccounts: null,
        savingsAccounts: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController, AuthController],
            providers: [
                UserService,
                AuthService,
                JwtService,
                JwtAuthService,
                Repository,
                {
                    provide: getRepositoryToken(UserSchema),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(CurrentTokenPair),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(UsedRefreshTokens),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                }
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    describe('Register a user', () => {
        const mockRegisterUserData = {
            name: "trung",
            email: "quangtrung@gmail.com",
            password: "test123",
            identificationNumber: 123,
            identificationType: 'citizenId',
            mobileNumber: "0974078473",
            country: "Viet Nam",
            proofOfIdentity: "identityImages.png",
        };

        const expectedResponse = {
            id: "30d1151f-f70e-408c-ac93-3733738a2402",
            name: "trung",
            email: "quangtrung@gmail.com",
            password: "test123",
            identificationNumber: 123,
            identificationType: 'citizenId',
            mobileNumber: "0974078473",
            country: "Viet Nam",
            proofOfIdentity: "identityImages.png",
            currentAccounts: null,
            savingsAccounts: null,
        }

        it('should register a new user', async () => {

            jest.spyOn(authService, 'register').mockResolvedValue(mockUser);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();
            await authController.register(mockRegisterUserData, responseMock);
            expect(ResponseAPI.success).toHaveBeenCalledWith(
                responseMock,
                expectedResponse,
                HttpStatus.OK
            );
        });

        it('should handle registration error', async () => {
            try {
                jest.spyOn(authService, 'register').mockRejectedValue(new Error());
                await authController.register(mockRegisterUserData, responseMock)
            } catch (error) {
                expect(ResponseAPI.success).not.toHaveBeenCalledWith(
                    responseMock,
                    mockRegisterUserData,
                    HttpStatus.OK
                );
            }
        });
    });
});
