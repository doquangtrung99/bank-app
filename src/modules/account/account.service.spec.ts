import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AccountService } from './account.service';
import { CurrentAccountSchema, SavingsAccountSchema } from '../../entities/account.entity';
import { Repository } from 'typeorm';
import { describe } from 'node:test';

describe('AccountService', () => {
    let accountService: AccountService;

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

});