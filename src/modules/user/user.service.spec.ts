import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSchema } from '../../entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
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

        userService = module.get<UserService>(UserService);
    });

    describe('Handle getUserByEmail()', () => {
        it('should return a user by email', async () => {
            const mockEmail = 'quangtrung@gmail.com';
            const mockUser: any = {
                id: "30d1151f-f70e-408c-ac93-3733738a2402",
                name: "trung",
                email: "quangtrung@gmail.com",
                identificationType: 'citizenId',
                identificationNumber: 123,
                mobileNumber: "0974078473",
                country: "Viet Nam",
                proofOfIdentity: "identityImages.png",
            };

            jest.spyOn(userService['userRepository'], 'findOne').mockResolvedValue(mockUser);

            const result = await userService.getUserByEmail(mockEmail);
            expect(result).toEqual(mockUser);
        });
    })

    describe('Handle getUserByUserId()', () => {
        it('should return a user by user ID', async () => {
            const mockUserId = '30d1151f-f70e-408c-ac93-3733738a2402';
            const mockUser = {
                id: "30d1151f-f70e-408c-ac93-3733738a2402",
                name: "trung",
                email: "quangtrung@gmail.com",
                password: "trung123",
                identificationType: 'citizenId',
                identificationNumber: 123,
                mobileNumber: "0974078473",
                country: "Viet Nam",
                proofOfIdentity: "identityImages.png",
            };

            jest.spyOn(userService['userRepository'], 'findOne').mockResolvedValue(mockUser);
            expect(mockUserId).toEqual(mockUser.id)
            expect(await userService.getUserByUserId(mockUserId)).toEqual(mockUser);
        });

        it('should handle user not found', async () => {
            const mockUserId = 'nonExistentUserId';
            jest.spyOn(userService['userRepository'], 'findOne').mockResolvedValue(null);
            await expect(userService.getUserByUserId(mockUserId)).rejects.toThrow(NotFoundException);
        });
    });

});
