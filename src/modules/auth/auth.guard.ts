
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { jwtConstants } from './constants';
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { JwtAuthService } from '../jwt/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtAuthService,
        private userService: UserService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { accessToken, userId } = this.extractTokenFromHeader(request);
        if (!accessToken) {
            throw new UnauthorizedException();
        }
        try {

            const payload = await this.jwtService.verifyToken(accessToken, jwtConstants.ACCESS_TOKEN_SECRET);

            if (userId !== payload.userId) {
                throw new UnauthorizedException();
            }

            const existUser = await this.userService.getUserByUserId(payload.userId);

            if (!existUser) {
                throw new UnauthorizedException();
            }
            delete existUser.password;
            request['user'] = existUser;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): { accessToken: string | undefined, userId: string | undefined } {
        const authorizationHeader = request.headers.authorization;
        const userIdHeader = request.headers['x-client-id'];

        if (!authorizationHeader) {
            // Handle the case where the Authorization header is missing
            return { userId: undefined, accessToken: undefined };
        }

        const [type, token] = authorizationHeader.split(' ');

        return {
            userId: userIdHeader ? String(userIdHeader) : undefined,
            accessToken: token,
        };
    }
}