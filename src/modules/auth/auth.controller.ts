import { Body, Controller, HttpStatus, Post, Res, Req, UseGuards } from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from '../../dto/user.dto';
import { UserSchema } from '../../entities/user.entity';
import { ResponseAPI } from '../../utils/responseApi';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ExtendRequest } from '../account/account.controller';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v1/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('login')
    async login(
        @Body() userLoginInfor: LoginUserDto,
        @Res() res: Response
    ): Promise<ResponseAPI<UserSchema>> {
        const response = await this.authService.login(userLoginInfor);
        if ('refreshToken' in response) {
            res.cookie('refreshToken', response.refreshToken, {
                maxAge: 7 * 24 * 60 * 60 * 1000,
                sameSite: 'strict',
                httpOnly: true,
            });
            delete response.refreshToken;
        }
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('validate')
    async validate(
        @Req() req: ExtendRequest,
        @Res() res: Response
    ) {
        const { token } = req.body;
        const refreshToken = req.cookies['refreshToken'];
        const response = await this.authService.validate(token, refreshToken);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('register')
    async register(
        @Body() registerUserData: RegisterUserDto,
        @Res() res: Response
    ): Promise<ResponseAPI<UserSchema>> {
        const response = await this.authService.register(registerUserData);
        return ResponseAPI.success(res, response, HttpStatus.OK);
    }

    @Post('refreshToken')
    async refreshToken(
        @Req() req: ExtendRequest,
        @Res() res: Response
    ) {
        const authorizationHeader = req.headers.authorization;
        const userIdHeader = req.headers['x-client-id'];

        const [type, currentAccessToken] = authorizationHeader.split(' ');
        const currentRefreshToken = req.cookies['refreshToken'];
        const { refreshToken, accessToken } = await this.authService.refreshToken(String(userIdHeader), currentAccessToken, currentRefreshToken);
        res.cookie('refreshToken', refreshToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
            httpOnly: true,
        })

        return ResponseAPI.success(res, { accessToken }, HttpStatus.OK);
    }

}