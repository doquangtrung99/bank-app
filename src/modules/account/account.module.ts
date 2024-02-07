import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrentAccountSchema, SavingsAccountSchema } from 'src/entities/account.entity';
import { UserService } from '../user/user.service';
import { UserSchema } from 'src/entities/user.entity';
import { JwtAuthService } from '../jwt/jwt.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    imports: [TypeOrmModule.forFeature([CurrentAccountSchema, SavingsAccountSchema, UserSchema])],
    controllers: [AccountController],
    providers: [AccountService, JwtAuthService, JwtService, UserService],
})

export class AccountModule { }