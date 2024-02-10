import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto, TransactionDto, TransferDto } from '../../dto/account.dto';
import { CurrentAccountSchema, SavingsAccountSchema } from '../../entities/account.entity';
import { UserSchema } from '../../entities/user.entity';
import { generateUniqueNumberWithTenDigits } from '../../utils';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(CurrentAccountSchema)
        private readonly accountRepository: Repository<CurrentAccountSchema>,
        @InjectRepository(SavingsAccountSchema)
        private readonly savingsRepository: Repository<SavingsAccountSchema>,
        private dataSource: DataSource
    ) { }

    currentType = {
        'CURRENT': this.accountRepository,
        'SAVINGS': this.savingsRepository
    }

    async getAccountBy({ type, options }) {
        const response = await this.currentType[type].findOne({
            where: {
                ...options
            }
        })

        return response
    }

    async getSingleAccount({ type, options }, user) {

        const res = await this.getAccountBy({ type, options });
        if (res?.userId !== user.id) {
            throw new UnauthorizedException();
        }
        return res;
    }

    async getAccountById(Schema, accountId) {
        const response = await Schema.findOne({
            where: {
                id: accountId
            }
        })

        return response

    }

    validateAccountType(typeAccount: string): void {
        if (typeAccount !== 'CURRENT' && typeAccount !== 'SAVINGS') {
            throw new Error('Invalid account type');
        }
    }

    async getAllBy({ type, options }) {
        const accounts = await this.currentType[type].find({
            where: {
                type,
                ...options
            }
        })

        return accounts
    }

    async getAllAccounts({ typeAccount, userId }): Promise<CurrentAccountSchema[]> {
        const accounts = await this.getAllBy({
            type: typeAccount,
            options: {
                userId
            }
        })

        if (accounts.length === 0) {
            throw new UnauthorizedException('No accounts found')
        }

        return accounts
    }

    async createAccount(accountData: CreateAccountDto, user: UserSchema): Promise<CurrentAccountSchema> {
        const { type } = accountData
        const { id: userId } = user
        const currentAccount = this.currentType[type];

        const uniqueAccountNumber = generateUniqueNumberWithTenDigits();

        const res = await this.getAccountBy({
            type,
            options: {
                userId
            }
        })

        if (res) {
            throw new HttpException('Can only have one account with this type', HttpStatus.BAD_REQUEST)
        }

        const newAccount = await currentAccount.save({
            userId,
            accountNumber: uniqueAccountNumber,
            ...accountData,
        })

        return newAccount
    }

    async accountQuery(Schema: any, id: string, updateFields: {}) {
        const response = await Schema.createQueryBuilder()
            .update(Schema)
            .set(updateFields)
            .where('id = :id', { id })
            .execute();

        return response
    }

    async deposite(data: TransactionDto, user): Promise<any> {
        const { type, accountId, amountMoney } = data
        const foundAccount = await this.getAccountBy({
            type,
            options: {
                id: accountId,
                userId: user.id
            }
        })

        if (!foundAccount) {
            throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
        }

        const AccountSchema = this.currentType[type];

        const updatedBalance = foundAccount.balance + amountMoney;
        const updatedResult = await this.accountQuery(
            AccountSchema,
            accountId,
            { balance: updatedBalance }
        )

        if (updatedResult.affected === 0) {
            throw new NotFoundException(`Entity with ID ${accountId} not found`);
        }

        const updatedRecord = await this.getAccountById(AccountSchema, accountId);

        return updatedRecord
    }

    async withdraw(data: TransactionDto, user: UserSchema) {
        const { type, accountId, amountMoney } = data
        const foundAccount = await this.getAccountBy({ type, options: { id: accountId, userId: user.id } })

        const AccountSchema = this.currentType[type];

        if (!foundAccount) {
            throw new UnauthorizedException('You do not have permission to withdraw from this account')
        }

        if (foundAccount.balance < amountMoney) {
            throw new HttpException('Insufficient funds', HttpStatus.BAD_REQUEST)
        }

        const updatedBalance = foundAccount.balance - amountMoney;
        const updatedResult = await this.accountQuery(
            AccountSchema,
            accountId,
            { balance: updatedBalance }
        )

        if (updatedResult.affected === 0) {
            throw new NotFoundException(`Entity with ID ${accountId} not found`);
        }

        const updatedRecord = await this.getAccountById(AccountSchema, accountId);

        return updatedRecord
    }

    async transfer(data: TransferDto, user: UserSchema) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const {
                sender: { accountId: senderId, type: savingsType },
                receiver: { accountNumber: receiverAccountNumber, type: currentType },
                amountMoney
            } = data;

            const senderAccount = await this.getAccountBy({ type: savingsType, options: { id: senderId, userId: user.id } });
            const receiverAccount = await this.getAccountBy({ type: currentType, options: { accountNumber: receiverAccountNumber } });

            if (user?.savingsAccounts?.id === receiverAccount?.id) {
                throw new HttpException('You do not have permission to transfer from this account', HttpStatus.FORBIDDEN);
            }
            if (!receiverAccount || !senderAccount) {
                throw new NotFoundException();
            }

            if (senderAccount.balance < amountMoney) {
                throw new HttpException('Insufficient funds', HttpStatus.BAD_REQUEST);
            }

            const currentReceiverBalance = receiverAccount.balance;
            const updatedSenderBalance = senderAccount.balance - amountMoney;
            const updatedReceiverBalance = currentReceiverBalance + amountMoney;

            const updatedSenderAccount = await queryRunner.manager.update(SavingsAccountSchema, senderId, {
                balance: updatedSenderBalance
            });

            const updatedReceiverAccount = await queryRunner.manager.update(CurrentAccountSchema, receiverAccount.id, {
                balance: updatedReceiverBalance
            });

            if (updatedSenderAccount.affected === 0 || updatedReceiverAccount.affected === 0) {
                throw new NotFoundException();
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new HttpException(err.message, err.status);
        } finally {
            await queryRunner.release();
        }
    }
}
