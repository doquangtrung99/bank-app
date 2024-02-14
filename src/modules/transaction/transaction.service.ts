import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TransactionDto, TransferDto } from '../../dto/account.dto';
import { CurrentAccountSchema, SavingsAccountSchema } from '../../entities/account.entity';
import { UserSchema } from '../../entities/user.entity';
import { AccountService } from '../account/account.service';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionService {
    constructor(
        private accountService: AccountService,
        private dataSource: DataSource
    ) { }
    async deposite(data: TransactionDto, user): Promise<any> {
        const { type, accountId, amountMoney } = data
        const foundAccount = await this.accountService.getAccountBy({
            type,
            options: {
                id: accountId,
                userId: user.id
            }
        })

        if (!foundAccount) {
            throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
        }

        const AccountSchema = this.accountService.currentType[type];

        const updatedBalance = foundAccount.balance + amountMoney;
        const updatedResult = await this.accountService.accountQuery(
            AccountSchema,
            accountId,
            { balance: updatedBalance }
        )

        if (updatedResult.affected === 0) {
            throw new NotFoundException(`Entity with ID ${accountId} not found`);
        }

        const updatedRecord = await this.accountService.getAccountById(AccountSchema, accountId);

        return updatedRecord
    }

    async withdraw(data: TransactionDto, user: UserSchema) {
        const { type, accountId, amountMoney } = data
        const foundAccount = await this.accountService.getAccountBy({ type, options: { id: accountId, userId: user.id } })

        const AccountSchema = this.accountService.currentType[type];

        if (!foundAccount) {
            throw new UnauthorizedException('You do not have permission to withdraw from this account')
        }

        if (foundAccount.balance < amountMoney) {
            throw new HttpException('Insufficient funds', HttpStatus.BAD_REQUEST)
        }

        const updatedBalance = foundAccount.balance - amountMoney;
        const updatedResult = await this.accountService.accountQuery(
            AccountSchema,
            accountId,
            { balance: updatedBalance }
        )

        if (updatedResult.affected === 0) {
            throw new NotFoundException(`Entity with ID ${accountId} not found`);
        }

        const updatedRecord = await this.accountService.getAccountById(AccountSchema, accountId);

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

            const senderAccount = await this.accountService.getAccountBy({ type: savingsType, options: { id: senderId, userId: user.id } });
            const receiverAccount = await this.accountService.getAccountBy({ type: currentType, options: { accountNumber: receiverAccountNumber } });

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
