import { Module } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UserSchema } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthService } from '../jwt/jwt.service';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { AccountService } from '../account/account.service';
import { CurrentAccountSchema, SavingsAccountSchema } from 'src/entities/account.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([SavingsAccountSchema, CurrentAccountSchema, UserSchema]),
    ],
    controllers: [TransactionController],
    providers: [
        TransactionService,
        AccountService,
        JwtAuthService,
        JwtService,
        UserService
    ],
})

export class TransactionModule { }