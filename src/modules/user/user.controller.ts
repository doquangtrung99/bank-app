import { Controller, Get, HttpStatus, Param, Res, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UserSchema } from '../../entities/user.entity';
import { ResponseAPI } from '../../utils/responseApi';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v1/user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @UseGuards(AuthGuard)
    @Get(':userId')
    async getUser(@Param('userId') userId: string, @Res() res, @Req() req): Promise<ResponseAPI<UserSchema>> {
        const currentUser = await this.userService.getUserByUserId(userId, req.user)
        return ResponseAPI.success(res, currentUser, HttpStatus.OK);
    }
}