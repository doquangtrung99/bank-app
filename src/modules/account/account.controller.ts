import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateAccountDto, DepositDto, TransferDto, WithdrawDto } from '../../dto/account.dto';
import { CurrentAccountSchema } from '../../entities/account.entity';
import { ResponseAPI } from '../../utils/responseApi';
import { Request, Response } from 'express';
import { UserSchema } from 'src/entities/user.entity';

export type ExtendRequest = Request & { user?: UserSchema }
@UseGuards(AuthGuard)
@Controller('api/v1/account')
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    @Get(':typeAccount/:accountId')
    async getAccount(
        @Param('typeAccount') typeAccount: string,
        @Param('accountId') accountId: string,
        @Res() res: Response,
        @Req() req: ExtendRequest,
    ): Promise<ResponseAPI<CurrentAccountSchema>> {
        this.accountService.validateAccountType(typeAccount);
        const response = await this.accountService.getSingleAccount({
            type: typeAccount,
            options: {
                id: accountId
            }
        }, req.user);

        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Get(':typeAccount/:userId')
    async getAllAccounts(
        @Param('typeAccount') typeAccount: string,
        @Res() res: Response,
        @Req() req: ExtendRequest
    ): Promise<ResponseAPI<CurrentAccountSchema>> {
        const { id: userId } = req.user
        this.accountService.validateAccountType(typeAccount);
        const response = await this.accountService.getAllAccounts({
            typeAccount,
            userId: userId
        })
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }
    @Post('create')
    async createAccount(
        @Req() req: ExtendRequest,
        @Res() res: Response,
        @Body() accountData: CreateAccountDto
    ): Promise<ResponseAPI<CurrentAccountSchema>> {
        const response = await this.accountService.createAccount(accountData, req.user);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }
}
