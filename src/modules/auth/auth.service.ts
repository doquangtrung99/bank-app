import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UserSchema } from '../../entities/user.entity';
import { UserService } from '../user/user.service';
import { ResponseAPI } from '../../utils/responseApi';
import { JwtAuthService } from '../jwt/jwt.service';
import { jwtConstants } from './constants';
import { RegisterUserDto } from '../../dto/user.dto';
import { Repository } from 'typeorm';
import { CONSTANT } from '../../constants';
import * as bcrypt from 'bcrypt';
import { CurrentTokenPair } from '../../entities/currentTokenPair.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsedRefreshTokens } from '../../entities/usedRefreshTokens.entity';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtAuthService: JwtAuthService,
        @InjectRepository(CurrentTokenPair)
        private currentTokenPairRepository: Repository<CurrentTokenPair>,
        @InjectRepository(UsedRefreshTokens)
        private refreshTokenUsed: Repository<UsedRefreshTokens>
    ) { }

    async generateTokenPairs(user: UserSchema) {

        const payload = { userId: user.id, username: user.name, email: user.email, role: 'user' };
        const accessToken = await this.jwtAuthService.generateToken(payload, { expiresIn: '1h', secret: jwtConstants.ACCESS_TOKEN_SECRET })
        const refreshToken = await this.jwtAuthService.generateToken(payload, { expiresIn: '7d', secret: jwtConstants.REFRESH_TOKEN_SECRET })
        return {
            accessToken,
            refreshToken
        }

    }

    async login(userLoginInfor): Promise<ResponseAPI<UserSchema>> {

        const user = await this.userService.getUserByEmail(userLoginInfor.email);
        if (!user) {
            throw new NotFoundException();
        }
        const isMatch = await bcrypt.compare(userLoginInfor.password, user.password);

        if (!isMatch) {
            throw new NotFoundException();
        }
        delete user.password;

        const { accessToken, refreshToken } = await this.generateTokenPairs(user);

        //store current Token Pair 
        const currentTokenPair = await this.currentTokenPairRepository.upsert({
            userId: user.id,
            accessToken,
            refreshToken
        }, ['userId'])

        if (!currentTokenPair) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return {
            ...user,
            accessToken,
            refreshToken
        }
    }

    async verifyTokenTryCatch(token, secret) {
        try {
            return await this.jwtAuthService.verifyToken(token, secret);
        } catch (error) {
            if (error.message === 'jwt expired') {
                throw new HttpException('Token is expired', HttpStatus.UNAUTHORIZED);
            } else {
                throw new HttpException('Invalid access token', HttpStatus.BAD_REQUEST);
            }
        }
    }
    async refreshToken(userId: string, accessToken: string, refreshToken: string) {

        await this.verifyTokenTryCatch(accessToken, jwtConstants.ACCESS_TOKEN_SECRET);

        const currentUser = await this.userService.getUserByUserId(userId);

        if (!currentUser) {
            throw new NotFoundException('User not found');
        }

        const foundCurrentTokenPair = await this.currentTokenPairRepository.findOne({
            where: {
                userId,
                accessToken,
                refreshToken
            }
        })

        if (!foundCurrentTokenPair) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.verifyTokenTryCatch(refreshToken, jwtConstants.REFRESH_TOKEN_SECRET);

        const foundRefreshTokenUsed = await this.refreshTokenUsed.find({
            where: {
                userId,
            }
        });
        for (let record of foundRefreshTokenUsed) {
            if (record.refreshToken === refreshToken) {
                throw new HttpException('Please relogin', HttpStatus.FORBIDDEN);
            }
        }

        await this.refreshTokenUsed.upsert({
            userId: currentUser.id,
            refreshToken
        }, ['id'])

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.generateTokenPairs(currentUser);

        await this.currentTokenPairRepository.upsert({
            userId: currentUser.id,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }, ['userId'])

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }
    }

    async validate(token: string, refreshToken: string) {
        if (!refreshToken || !token) {
            throw new ForbiddenException();
        }

        const decoded = await this.verifyTokenTryCatch(token, jwtConstants.ACCESS_TOKEN_SECRET);

        const foundCurrentTokenPair = await this.currentTokenPairRepository.findOne({
            where: {
                userId: decoded.userId,
                accessToken: token,
                refreshToken
            }
        })

        const user = await this.userService.getUserByUserId(decoded.userId);
        if (!user) {
            throw new NotFoundException();
        }
        if (!foundCurrentTokenPair) {
            throw new ForbiddenException();
        }

        delete user.password
        return user
    }

    async register(userBody: RegisterUserDto): Promise<UserSchema> {
        const user = await this.userService.getUserByEmail(userBody.email);

        if (user) {
            throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
        }

        const hashPassword = await bcrypt.hash(userBody.password, CONSTANT.SALT);
        if (!hashPassword) {
            throw new Error('Bcrypt hash error');
        }
        userBody.password = hashPassword;
        const createdUser: UserSchema = await this.userService.createUser(userBody);
        delete createdUser.password;

        return createdUser;
    }

}
