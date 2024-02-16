import { Body, Controller, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DepositDto, TransferDto, WithdrawDto } from '../../dto/account.dto';
import { CurrentAccountSchema } from '../../entities/account.entity';
import { ResponseAPI } from '../../utils/responseApi';
import { Request, Response } from 'express';
import { UserSchema } from 'src/entities/user.entity';
import { TransactionService } from './transaction.service';

export type ExtendRequest = Request & { user?: UserSchema }
@UseGuards(AuthGuard)
@Controller('api/v1/transaction')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @Post('deposit')
    async deposit(
        @Req() req: ExtendRequest,
        @Res() res: Response,
        @Body() data: DepositDto
    ): Promise<ResponseAPI<CurrentAccountSchema>> {
        const response = await this.transactionService.deposit(data, req.user);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('withdraw')
    async withdraw(
        @Req() req: ExtendRequest,
        @Res() res: Response,
        @Body() accountData: WithdrawDto
    ): Promise<ResponseAPI<CurrentAccountSchema>> {
        const response = await this.transactionService.withdraw(accountData, req.user);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('transfer')
    async transfer(
        @Req() req: ExtendRequest,
        @Res() res: Response,
        @Body() accountData: TransferDto
    ): Promise<ResponseAPI<CurrentAccountSchema>> {
        await this.transactionService.transfer(accountData, req.user);
        return ResponseAPI.success(res, "Transfer successfully", HttpStatus.OK);
    }
}
