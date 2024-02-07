import { Type } from "class-transformer";
import { IsEnum, IsIn, IsNotEmpty, IsObject, ValidateNested } from "class-validator"

export class CreateAccountDto {
    @IsNotEmpty()
    userId: string;

    @IsNotEmpty()
    @IsIn(['SAVINGS', 'CURRENT'])
    type: 'SAVINGS' | 'CURRENT';
}

class SenderDto {
    @IsNotEmpty()
    accountId: string;

    @IsNotEmpty()
    @IsIn(['SAVINGS'])
    type: 'SAVINGS';


}

class ReceiverDto {
    @IsNotEmpty()
    accountId: string;

    @IsNotEmpty()
    @IsIn(['CURRENT'])
    type: 'CURRENT';
}

export class TransferDto {
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => SenderDto)
    sender: SenderDto;

    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => ReceiverDto)
    receiver: ReceiverDto;

    @IsNotEmpty()
    amountMoney: number;
}

export class DepositDto {
    @IsNotEmpty()
    accountId: string;

    @IsNotEmpty()
    amountMoney: number;

    @IsNotEmpty()
    @IsIn(['SAVINGS'])
    type: 'SAVINGS';
}

export class WithdrawDto {
    @IsNotEmpty()
    accountId: string;

    @IsNotEmpty()
    amountMoney: number;

    @IsNotEmpty()
    @IsIn(['CURRENT'])
    type: 'CURRENT';
}

export class TransactionDto {
    @IsNotEmpty()
    accountId: string;

    @IsNotEmpty()
    amountMoney: number;

    @IsNotEmpty()
    @IsIn(['SAVINGS', 'CURRENT'])
    type: 'SAVINGS' | 'CURRENT';
}
