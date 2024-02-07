import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express'
import { ResponseAPI } from '../../utils/responseApi';
import { HttpStatus } from '@nestjs/common';
import { UserSchema } from '../../entities//user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CurrentAccountSchema, SavingsAccountSchema } from '../../entities/account.entity';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { DepositDto, TransferDto, WithdrawDto } from '../../dto/account.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtAuthService } from '../jwt/jwt.service';

export const dataSourceMockFactory: () => MockType<DataSource> = jest.fn(() => ({
    createQueryRunner: jest.fn(),
    connect: jest.fn(),
    startTranaction: jest.fn(),
    release: jest.fn(),
    rollbackTransaction: jest.fn(),
    commitTransaction: jest.fn(),
}));

export type MockType<T> = {
    [P in keyof T]?: jest.Mock<{}>;
};

describe('AccountController', () => {

    let accountController: AccountController;
    let accountService: AccountService;

    const currentType = "CURRENT";
    const savingsType = "SAVINGS";

    type HasUserType = Request & {
        user: UserSchema
    }

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
            identification: 123,
            mobileNumber: "0974078473",
            country: "Viet Nam",
            proofOfIdentity: "identityImages.png",
            currentAccounts: {
                id: "856428bb-0150-4d1d-8a4e-ff2f388180a2",
                userId: "30d1151f-f70e-408c-ac93-3733738a2402",
                accountNumber: 7675815589,
                type: currentType,
                balance: 0
            },
            savingsAccounts: {
                id: "04c7dc82-10e2-452a-bbd4-318bd863d3b8",
                userId: "30d1151f-f70e-408c-ac93-3733738a2402",
                accountNumber: 2675115681,
                type: savingsType,
                balance: 0
            },
        }
    } as unknown as HasUserType;

    const responseMock = {
        status: jest.fn(() => ({
            json: jest.fn()
        }))
    } as unknown as Response

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AccountController],
            providers: [AccountService,
                {
                    provide: DataSource,
                    useFactory: dataSourceMockFactory
                },
                {
                    provide: getRepositoryToken(CurrentAccountSchema),
                    useClass: Repository
                },
                {
                    provide: getRepositoryToken(SavingsAccountSchema),
                    useClass: Repository
                },
                {
                    provide: getRepositoryToken(UserSchema),
                    useValue: {}
                },
                JwtAuthService, JwtService, UserService
            ],
        }).compile();

        accountController = module.get<AccountController>(AccountController);
        accountService = module.get<AccountService>(AccountService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    describe('Create an account', () => {

        it('should create a account with type "CURRENT" successfully', async () => {
            const response = {
                id: requestMock.user.id,
                userId: "75d762e3-5502-4a33-86f8-51a954f3c761",
                accountNumber: 2675115681,
                type: currentType,
                balance: 0
            };

            const requestCreate = {
                type: "CURRENT" as "CURRENT",
                userId: requestMock.user.id
            }
            jest.spyOn(accountService, 'createAccount').mockResolvedValueOnce(response);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();

            await accountController.createAccount(requestCreate, responseMock, requestCreate);
            expect(ResponseAPI.success).toHaveBeenCalledWith(
                responseMock,
                response,
                HttpStatus.OK,
            );
        })

        it('should create a account with type "SAVINGS" successfully', async () => {
            const response = {
                id: requestMock.user.id,
                userId: "75d762e3-5502-4a33-86f8-51a954f3c761",
                accountNumber: 2675115681,
                type: savingsType,
                balance: 0
            };

            const requestCreate = {
                type: "SAVINGS" as "SAVINGS",
                userId: requestMock.user.id
            }

            jest.spyOn(accountService, 'createAccount').mockResolvedValueOnce(response);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();

            await accountController.createAccount(requestCreate, responseMock, requestCreate);
            expect(ResponseAPI.success).toHaveBeenCalledWith(
                responseMock,
                response,
                HttpStatus.OK,
            );

        })
    })

    describe('Deposite', () => {
        const transactionDto: DepositDto = {
            type: 'SAVINGS',
            accountId: requestMock.user.currentAccounts.id,
            amountMoney: 500,
        };

        const depositResponse = {
            id: requestMock.user.currentAccounts.id,
            userId: requestMock.user.id,
            accountNumber: 2675115681,
            type: savingsType,
            balance: 5000
        };

        it('should successfully deposit to "SAVINGS" account type and return response', async () => {
            jest
                .spyOn(accountService, 'deposite')
                .mockResolvedValueOnce(depositResponse);

            jest.spyOn(ResponseAPI, 'success').mockImplementation();

            await accountController.deposite({ user: requestMock.user }, responseMock, transactionDto);
            expect(ResponseAPI.success).toHaveBeenCalledWith(
                responseMock,
                depositResponse,
                HttpStatus.OK,
            );
        })

        it('should deposit unsuccessfully with "CURRENT" account type', async () => {
            const currentDepositDto = {
                type: 'CURRENT',
                accountId: requestMock.user.currentAccounts.id,
                amountMoney: 500,
            };

            const depositDto = plainToInstance(DepositDto, currentDepositDto)
            const errors = await validate(depositDto);
            expect(errors.length).not.toBe(0);
            expect(JSON.stringify(errors)).toContain(`type must be one of the following values: SAVINGS`);
        });
    })

    describe('Withdraw', () => {
        const transactionDto: WithdrawDto = {
            type: 'CURRENT',
            accountId: requestMock.user.currentAccounts.id,
            amountMoney: 500,
        };

        const widthdrawResponse = {
            id: requestMock.user.currentAccounts.id,
            userId: requestMock.user.id,
            accountNumber: 2675115681,
            type: currentType,
            balance: 5000
        };

        it('should successfully withdraw and return response', async () => {

            jest.spyOn(accountService, 'withdraw').mockResolvedValueOnce(widthdrawResponse);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();

            await accountController.withdraw({ user: requestMock.user }, responseMock, transactionDto);

            expect(accountService.withdraw).toHaveBeenCalledWith(transactionDto, requestMock.user);
            expect(ResponseAPI.success).toHaveBeenCalledWith(
                responseMock,
                widthdrawResponse,
                HttpStatus.OK
            );
        })

        it('should handle withdraw unsuccessfully with "SAVINGS" account type', async () => {
            const currentWidthdrawDto = {
                type: 'SAVINGS',
                accountId: requestMock.user.currentAccounts.id,
                amountMoney: 500,
            };

            const withdrawDto = plainToInstance(WithdrawDto, currentWidthdrawDto)
            const errors = await validate(withdrawDto);
            expect(errors.length).not.toBe(0);
            expect(JSON.stringify(errors)).toContain(`type must be one of the following values: CURRENT`);
        });

    });

    describe('Transfer', () => {

        it('should successfully transfer within myself account : type account from "SAVINGS" to "CURRENT"', async () => {

            const transferDto: TransferDto = {
                sender: {
                    type: 'SAVINGS',
                    accountId: requestMock.user.currentAccounts.id,
                },
                receiver: {
                    type: 'CURRENT',
                    accountId: requestMock.user.currentAccounts.id,
                },
                amountMoney: 500
            };

            jest.spyOn(accountService, 'transfer').mockReturnValue(undefined);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();
            const res = await accountController.transfer(requestMock.user, responseMock, transferDto);

            expect(res).toBe(undefined);
            expect(ResponseAPI.success).toHaveBeenCalledTimes(1)
            expect(ResponseAPI.success).toHaveBeenCalledWith(
                responseMock,
                'Transfer successfully',
                HttpStatus.OK
            )

        })

        it('should successfully transfer from myself account to other account: type account from "SAVINGS" to "CURRENT"', async () => {

            const transferDto: TransferDto = {
                sender: {
                    type: 'SAVINGS',
                    accountId: requestMock.user.currentAccounts.id,
                },
                receiver: {
                    type: 'CURRENT',
                    accountId: 'other-account-id',
                },
                amountMoney: 500
            };

            jest.spyOn(accountService, 'transfer').mockReturnValue(undefined);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();
            const res = await accountController.transfer(requestMock.user, responseMock, transferDto);

            expect(res).toBe(undefined);
            expect(ResponseAPI.success).toHaveBeenCalledTimes(1)
            expect(ResponseAPI.success).toHaveBeenCalledWith(
                responseMock,
                'Transfer successfully',
                HttpStatus.OK
            )
        })
    })


});
