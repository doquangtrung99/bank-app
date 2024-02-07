import { IsEmail, IsNotEmpty, IsStrongPassword, Matches } from "class-validator"

export class RegisterUserDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    identification: number;

    @IsNotEmpty()
    mobileNumber: string;

    @IsNotEmpty()
    country: string;

    @IsNotEmpty()
    proofOfIdentity: string;
}

export class LoginUserDto {
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;
}