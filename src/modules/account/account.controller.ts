import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateAccountDto, DepositDto, TransactionDto, TransferDto, WithdrawDto } from '../../dto/account.dto';
import { CurrentAccountSchema } from '../../entities/account.entity';
import { ResponseAPI } from '../../utils/responseApi';

@UseGuards(AuthGuard)
@Controller('api/v1/account')
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    @Get(':typeAccount/:accountId')
    async getAccount(
        @Param('typeAccount') typeAccount: string,
        @Param('accountId') accountId: string,
        @Res() res,
        @Req() req,
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
        @Res() res,
        @Req() req
    ): Promise<ResponseAPI<CurrentAccountSchema>> {
        const { userId } = req.user
        this.accountService.validateAccountType(typeAccount);
        const response = await this.accountService.getAllAccounts({
            typeAccount,
            userId: userId
        })
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }
    @Post('create')
    async createAccount(@Req() req, @Res() res, @Body() accountData: CreateAccountDto): Promise<ResponseAPI<CurrentAccountSchema>> {
        const response = await this.accountService.createAccount(accountData, req.user);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('deposite')
    async deposite(@Req() req, @Res() res, @Body() data: DepositDto): Promise<ResponseAPI<CurrentAccountSchema>> {
        const response = await this.accountService.deposite(data, req.user);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('withdraw')
    async withdraw(@Req() req, @Res() res, @Body() accountData: WithdrawDto): Promise<ResponseAPI<CurrentAccountSchema>> {
        const response = await this.accountService.withdraw(accountData, req.user);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('transfer')
    async transfer(@Req() req, @Res() res, @Body() accountData: TransferDto): Promise<ResponseAPI<CurrentAccountSchema>> {
        await this.accountService.transfer(accountData, req.user);
        return ResponseAPI.success(res, "Transfer successfully", HttpStatus.OK);
    }
}
