// user.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, HttpStatus, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AccountService } from './account.service';
import { CurrentAccountSchema, SavingsAccountSchema } from '../../entities/account.entity';
import { DataSource, Repository } from 'typeorm';
import { TransactionDto, TransferDto } from 'src/dto/account.dto';
import { describe } from 'node:test';

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

describe('AccountService', () => {
    let accountService: AccountService;
    let dataSourceMock: MockType<DataSource>

    let currentAccountRepository: Repository<CurrentAccountSchema>;
    let savingsAccountRepository: Repository<SavingsAccountSchema>;
    const currentType = "CURRENT";
    const savingsType = "SAVINGS";
    const mockCurrentUser = {
        id: "30d1151f-f70e-408c-ac93-3733738a2402",
        name: "trung",
        email: "quangtrung@gmail.com",
        password: "test123",
        identificationType: '',
        identificationNumber: 123,
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccountService,
                {
                    provide: DataSource,
                    useFactory: dataSourceMockFactory
                },
                AccountService,
                {
                    provide: getRepositoryToken(CurrentAccountSchema),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(SavingsAccountSchema),
                    useClass: Repository,
                }
            ],
        }).compile();

        accountService = module.get<AccountService>(AccountService);
        dataSourceMock = module.get(DataSource);
        currentAccountRepository = module.get(getRepositoryToken(CurrentAccountSchema));
        savingsAccountRepository = module.get(getRepositoryToken(SavingsAccountSchema));
    });

    describe('handle getAccountBy()', () => {
        const response = {
            id: "ccd29ce0-88be-4194-9aae-77a98da8d7e0",
            userId: mockCurrentUser.id,
            accountNumber: 2675115681,
            type: currentType,
            balance: 0
        }

        it('should get account sucessfully with type = "CURRENT" ', async () => {
            const options = {
                id: mockCurrentUser.id
            };

            const mockAccountFound = {
                id: "ccd29ce0-88be-4194-9aae-77a98da8d7e0",
                userId: mockCurrentUser.id,
                accountNumber: 2675115681,
                type: currentType,
                balance: 0
            };

            jest.spyOn(currentAccountRepository, 'findOne').mockResolvedValue(mockAccountFound);
            const res = await accountService.getAccountBy({ type: currentType, options });
            expect(currentAccountRepository.findOne).toHaveBeenCalledWith({ where: { ...options } });
            expect(res).toEqual(response);
        })

        it('should get account sucessfully with type = "SAVINGS" ', async () => {
            const options = {
                id: mockCurrentUser.id
            };

            jest.spyOn(accountService, 'getAccountBy').mockResolvedValue(response);
            const res = await accountService.getAccountBy({ type: savingsType, options });
            expect(res).toEqual(response);
        })
    })

    describe('Create an account', () => {
        const options = {
            userId: mockCurrentUser.id
        };

        it('should create an account sucessfully with type "CURRENT" ', async () => {
            const response = {
                id: mockCurrentUser.id,
                userId: "75d762e3-5502-4a33-86f8-51a954f3c761",
                accountNumber: 2675115681,
                type: currentType,
                balance: 0
            };

            const requestCreate = {
                type: "CURRENT" as "CURRENT",
                userId: mockCurrentUser.id
            }

            jest.spyOn(currentAccountRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(currentAccountRepository, 'save').mockResolvedValue(response);
            expect(await accountService.createAccount(requestCreate, mockCurrentUser)).toEqual(response);
            expect(currentAccountRepository.findOne).toHaveBeenCalledWith({ where: { ...options } });
        })

        it('should have only one account with type "CURRENT" ', async () => {
            const response = {
                id: mockCurrentUser.id,
                userId: "75d762e3-5502-4a33-86f8-51a954f3c761",
                accountNumber: 2675115681,
                type: currentType,
                balance: 0
            };

            const requestCreate = {
                type: "CURRENT" as "CURRENT",
                userId: mockCurrentUser.id
            }
            jest.spyOn(currentAccountRepository, 'save').mockImplementation();
            jest.spyOn(currentAccountRepository, 'findOne').mockResolvedValue(response);
            await expect(accountService.createAccount(requestCreate, mockCurrentUser)).rejects.toThrow(new HttpException('Can only have one account with this type', HttpStatus.BAD_REQUEST));
            expect(currentAccountRepository.save).not.toHaveBeenCalled();
        })

        it('should create an account sucessfully with type "SAVINGS"', async () => {
            const response = {
                id: mockCurrentUser.id,
                userId: "75d762e3-5502-4a33-86f8-51a954f3c761",
                accountNumber: 2675115681,
                type: savingsType,
                balance: 0
            };

            const requestCreate = {
                type: "SAVINGS" as "SAVINGS",
                userId: mockCurrentUser.id
            }

            jest.spyOn(savingsAccountRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(savingsAccountRepository, 'save').mockResolvedValue(response);
            expect(await accountService.createAccount(requestCreate, mockCurrentUser)).toEqual(response);
            expect(savingsAccountRepository.findOne).toHaveBeenCalledWith({ where: { ...options } });
        })

        it('should have only one account with type "SAVINGS" ', async () => {
            const response = {
                id: mockCurrentUser.id,
                userId: "75d762e3-5502-4a33-86f8-51a954f3c761",
                accountNumber: 1538572947,
                type: savingsType,
                balance: 0
            };

            const requestCreate = {
                type: "SAVINGS" as "SAVINGS",
                userId: mockCurrentUser.id
            }
            jest.spyOn(savingsAccountRepository, 'save').mockImplementation();
            jest.spyOn(savingsAccountRepository, 'findOne').mockResolvedValue(response);
            await expect(accountService.createAccount(requestCreate, mockCurrentUser)).rejects.toThrow(new HttpException('Can only have one account with this type', HttpStatus.BAD_REQUEST));
            expect(savingsAccountRepository.save).not.toHaveBeenCalled();
        })
    })

    describe('Deposit', () => {

        it('should deposit money sucessfully into the account', async () => {
            const data: TransactionDto = {
                type: 'CURRENT',
                accountId: 'account123',
                amountMoney: 100,
            };

            const foundAccountBeforeUpdate = {
                id: "cf004cee-c5d5-45bc-9a2c-3c9c99b34498",
                userId: "30d1151f-f70e-408c-ac93-3733738a2402",
                accountNumber: "5089051661",
                type: "SAVINGS",
                balance: 200,
            };

            const output = {
                id: "cf004cee-c5d5-45bc-9a2c-3c9c99b34498",
                userId: "30d1151f-f70e-408c-ac93-3733738a2402",
                accountNumber: "5089051661",
                type: "SAVINGS",
                balance: 300
            }

            const accountQueryMock = jest.spyOn(accountService, 'accountQuery').mockResolvedValueOnce({
                affected: 1,
            });

            jest.spyOn(accountService, 'getAccountBy').mockResolvedValueOnce(foundAccountBeforeUpdate);
            jest.spyOn(accountService, 'getAccountById').mockResolvedValueOnce(output);

            const updatedRecord = await accountService.deposite(data, mockCurrentUser);

            expect(accountQueryMock).toHaveBeenCalledWith(
                expect.anything(),
                'account123',
                { balance: 300 },
            );
            expect(updatedRecord).toEqual(output);
        });

        it('should throw an error if the account is not found', async () => {
            const data: TransactionDto = {
                type: 'CURRENT',
                accountId: 'account123',
                amountMoney: 100,
            };

            jest.spyOn(accountService, 'getAccountBy').mockResolvedValueOnce(null);

            await expect(accountService.deposite(data, mockCurrentUser)).rejects.toThrow(
                new HttpException('Account not found', HttpStatus.NOT_FOUND),
            );
        });

    })

    describe('Withdraw', () => {

        it('should withdraw money from the account sucessfully', async () => {
            const data: TransactionDto = {
                type: 'CURRENT',
                accountId: 'account123',
                amountMoney: 50,
            };

            const foundAccount = {
                id: 'account123',
                balance: 100,
            };

            const output = {
                id: "cf004cee-c5d5-45bc-9a2c-3c9c99b34498",
                userId: "30d1151f-f70e-408c-ac93-3733738a2402",
                accountNumber: "5089051661",
                type: "SAVINGS",
                balance: 50
            }

            const accountQueryMock = jest.spyOn(accountService, 'accountQuery').mockResolvedValueOnce({
                affected: 1,
            });

            jest.spyOn(accountService, 'getAccountBy').mockResolvedValueOnce(foundAccount);
            jest.spyOn(accountService, 'getAccountById').mockResolvedValueOnce(output);

            const updatedRecord = await accountService.withdraw(data, mockCurrentUser);

            expect(accountService.getAccountById).toHaveBeenCalledWith(expect.anything(), 'account123');
            expect(accountQueryMock).toHaveBeenCalledWith(
                expect.anything(),
                'account123',
                { balance: 50 },
            );
            expect(updatedRecord).toEqual(output);
        });

        it('should throw an error if the account is not found', async () => {
            const data: TransactionDto = {
                type: 'CURRENT',
                accountId: 'account123',
                amountMoney: 50,
            };

            jest.spyOn(accountService, 'getAccountBy').mockResolvedValueOnce(null);

            await expect(accountService.withdraw(data, mockCurrentUser)).rejects.toThrowError(
                new UnauthorizedException('You do not have permission to withdraw from this account'),
            );
        });

        it('should throw an error if there are insufficient funds', async () => {
            const user = { id: 'user123' };
            const data: TransactionDto = {
                type: 'CURRENT',
                accountId: 'account123',
                amountMoney: 150,
            };

            const foundAccount = {
                id: 'account123',
                balance: 100,
            };

            jest.spyOn(accountService, 'getAccountBy').mockResolvedValueOnce(foundAccount);

            await expect(accountService.withdraw(data, mockCurrentUser)).rejects.toThrowError(
                new Error('Insufficient funds'),
            );
        });
    })

    describe('Transfer', () => {

        it('should transfer successfully from savings to other"s current account', async () => {

            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    update: jest.fn().mockResolvedValue({ affected: 1 }),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            };

            const data: TransferDto = {
                sender: { accountId: 'senderId', type: 'SAVINGS' },
                receiver: { accountNumber: 123, type: 'CURRENT' },
                amountMoney: 100,
            };

            const senderAccount = { balance: 200 };
            const receiverAccount = { balance: 100 };

            jest.spyOn(dataSourceMock, 'createQueryRunner').mockReturnValue(mockQueryRunner);
            jest.spyOn(accountService, 'getAccountBy').mockImplementation(({ options }) => {
                if (options.id === 'senderId') {
                    return Promise.resolve(senderAccount);
                } else if (options.accountNumber === 123) {
                    return Promise.resolve(receiverAccount);
                }
            });
            await accountService.transfer(data, mockCurrentUser);

            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'SAVINGS', options: { id: 'senderId', userId: mockCurrentUser.id } });
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'CURRENT', options: { accountNumber: 123 } });
            expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.manager.update).toHaveBeenCalledTimes(2);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
        });

        it('should transfer successfully from my savings account to my current account', async () => {

            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    update: jest.fn().mockResolvedValue({ affected: 1 }),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            };

            const data: TransferDto = {
                sender: { accountId: 'senderId', type: 'SAVINGS' },
                receiver: { accountNumber: 123, type: 'CURRENT' },
                amountMoney: 100,
            };

            const senderAccount = { balance: 500 };
            const receiverAccount = { id: 'senderId', accountNumber: 123, balance: 100 };

            jest.spyOn(dataSourceMock, 'createQueryRunner').mockReturnValue(mockQueryRunner);
            jest.spyOn(accountService, 'getAccountBy').mockImplementation(({ options }) => {
                if (options.id === 'senderId') {
                    return Promise.resolve(senderAccount);
                } else if (options.accountNumber === 123) {
                    return Promise.resolve(receiverAccount);
                }
            });
            await accountService.transfer(data, mockCurrentUser);

            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'SAVINGS', options: { id: 'senderId', userId: mockCurrentUser.id } });
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'CURRENT', options: { accountNumber: 123 } });
            expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.manager.update).toHaveBeenCalledTimes(2);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
        });

        it('should throw HttpException for insufficient funds', async () => {

            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    update: jest.fn().mockResolvedValue({ affected: 1 }),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            };

            const data: TransferDto = {
                sender: { accountId: 'senderId', type: 'SAVINGS' },
                receiver: { accountNumber: 123, type: 'CURRENT' },
                amountMoney: 200,
            };

            const senderAccount = { balance: 100 };
            const receiverAccount = { balance: 100 };

            jest.spyOn(dataSourceMock, 'createQueryRunner').mockReturnValue(mockQueryRunner);
            jest.spyOn(accountService, 'getAccountBy').mockImplementation(({ options }) => {
                if (options.id === 'senderId') {
                    return Promise.resolve(senderAccount);
                } else if (options.accountNumber === 123) {
                    return Promise.resolve(receiverAccount);
                }
            });

            await expect(accountService.transfer(data, mockCurrentUser)).rejects.toThrow(new HttpException('Insufficient funds', HttpStatus.BAD_REQUEST));
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'SAVINGS', options: { id: 'senderId', userId: mockCurrentUser.id } });
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'CURRENT', options: { accountNumber: 123 } });
            expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
        })

        it('handle transfer fails with account sender not found', async () => {

            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    update: jest.fn().mockResolvedValue({ affected: 1 }),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            };

            const data: TransferDto = {
                sender: { accountId: 'senderId', type: 'SAVINGS' },
                receiver: { accountNumber: 123, type: 'CURRENT' },
                amountMoney: 200,
            };

            const receiverAccount = { id: 'receiverId', balance: 100 };

            jest.spyOn(dataSourceMock, 'createQueryRunner').mockReturnValue(mockQueryRunner);
            jest.spyOn(accountService, 'getAccountBy').mockImplementation(({ options }) => {
                if (options.id === 'senderId') {
                    return Promise.resolve(null);
                } else if (options.accountNumber === 123) {
                    return Promise.resolve(receiverAccount);
                }
            });

            await expect(accountService.transfer(data, mockCurrentUser)).rejects.toThrow(new NotFoundException());
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'SAVINGS', options: { id: 'senderId', userId: mockCurrentUser.id } });
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'CURRENT', options: { accountNumber: 123 } });
            expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
        })

        it('handle transfer fails with account receiver not found', async () => {

            const mockQueryRunner = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    update: jest.fn().mockResolvedValue({ affected: 1 }),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            };

            const data: TransferDto = {
                sender: { accountId: 'senderId', type: 'SAVINGS' },
                receiver: { accountNumber: 123, type: 'CURRENT' },
                amountMoney: 200,
            };
            const senderAccount = { balance: 500 };

            jest.spyOn(dataSourceMock, 'createQueryRunner').mockReturnValue(mockQueryRunner);
            jest.spyOn(accountService, 'getAccountBy').mockImplementation(({ options }) => {
                if (options.id === 'senderId') {
                    return Promise.resolve(senderAccount);
                } else if (options.accountNumber === 123) {
                    return Promise.resolve(null);
                }
            });

            await expect(accountService.transfer(data, mockCurrentUser)).rejects.toThrow(new NotFoundException());
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'SAVINGS', options: { id: 'senderId', userId: mockCurrentUser.id } });
            expect(accountService.getAccountBy).toHaveBeenCalledWith({ type: 'CURRENT', options: { accountNumber: 123 } });
            expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
            expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
        })
    })
});