import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express'
import { ResponseAPI } from '../../utils/responseApi';
import { HttpStatus } from '@nestjs/common';
import { UserSchema } from '../../entities//user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { CurrentAccountSchema, SavingsAccountSchema } from '../../entities/account.entity';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { DepositDto, TransferDto, WithdrawDto } from '../../dto/account.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtAuthService } from '../jwt/jwt.service';
import { AccountController } from '../account/account.controller';
import { AccountService } from '../account/account.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

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

describe('TransactionController', () => {

    let transactionController: TransactionController;
    let transactionService: TransactionService;

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
            controllers: [AccountController, TransactionController],
            providers: [
                AccountService,
                TransactionService,
                JwtAuthService,
                JwtService,
                UserService,
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
            ],
        }).compile();

        transactionController = module.get<TransactionController>(TransactionController);
        transactionService = module.get<TransactionService>(TransactionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
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
                .spyOn(transactionService, 'deposit')
                .mockResolvedValueOnce(depositResponse);

            jest.spyOn(ResponseAPI, 'success').mockImplementation();

            await transactionController.deposit(requestMock, responseMock, transactionDto);
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

            jest.spyOn(transactionService, 'withdraw').mockResolvedValueOnce(widthdrawResponse);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();

            await transactionController.withdraw(requestMock, responseMock, transactionDto);

            expect(transactionService.withdraw).toHaveBeenCalledWith(transactionDto, requestMock.user);
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
                    accountNumber: 2675115681,
                },
                amountMoney: 500
            };

            jest.spyOn(transactionService, 'transfer').mockReturnValue(undefined);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();
            const res = await transactionController.transfer(requestMock, responseMock, transferDto);

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
                    accountNumber: 2675115681,
                },
                amountMoney: 500
            };

            jest.spyOn(transactionService, 'transfer').mockReturnValue(undefined);
            jest.spyOn(ResponseAPI, 'success').mockImplementation();
            const res = await transactionController.transfer(requestMock, responseMock, transferDto);

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
