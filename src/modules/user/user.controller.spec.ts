import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Request, Response } from 'express'
import { ResponseAPI } from '../../utils/responseApi';
import { NotFoundException } from '@nestjs/common';
import { UserSchema } from '../../entities//user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthService } from '../jwt/jwt.service';

describe('UserController', () => {

    let userController: UserController;
    let userService: UserService;

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
            identificationType: 'citizenId',
            identificationNumber: 123,
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
        identificationType: 'citizenId',
        identificationNumber: 123,
        mobileNumber: "0974078473",
        country: "Viet Nam",
        proofOfIdentity: "identityImages.png",
        currentAccounts: null,
        savingsAccounts: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [UserService, JwtService, JwtAuthService, {
                provide: getRepositoryToken(UserSchema),
                useValue: {
                    findOne: jest.fn(),
                    save: jest.fn(),
                    create: jest.fn(),
                },
            }],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    describe('Get user information', () => {
        it('should return a user', async () => {
            const mockUserId = requestMock.params.userId;

            jest.spyOn(userService, 'getUserByUserId').mockResolvedValue(mockUser);
            const result = await userController.getUser(mockUserId, responseMock, requestMock);
            expect(result).toEqual(await ResponseAPI.success(responseMock, mockUser, 200));
        });

        it('should handle user not found', async () => {
            try {
                const mockUserId = 'nonExistentUserId';
                jest.spyOn(userService, 'getUserByUserId').mockRejectedValue(new NotFoundException());
                await userController.getUser(mockUserId, responseMock, requestMock);
            } catch (error) {
                expect(error.status).toBe(404);
            }
        });
    });
});
