import { IsEmail, IsNotEmpty, IsStrongPassword } from "class-validator"

export class RegisterUserDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    identificationType: string;

    @IsNotEmpty()
    identificationNumber: number;

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