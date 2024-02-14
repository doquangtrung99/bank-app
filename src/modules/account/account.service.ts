import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto, TransactionDto, TransferDto } from '../../dto/account.dto';
import { CurrentAccountSchema, SavingsAccountSchema } from '../../entities/account.entity';
import { UserSchema } from '../../entities/user.entity';
import { generateUniqueNumberWithTenDigits } from '../../utils';
import { Repository } from 'typeorm';

@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(CurrentAccountSchema)
        private readonly accountRepository: Repository<CurrentAccountSchema>,
        @InjectRepository(SavingsAccountSchema)
        private readonly savingsRepository: Repository<SavingsAccountSchema>,
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

}
