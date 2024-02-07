import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { UserSchema } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthService } from '../jwt/jwt.service';
import { Repository } from 'typeorm';
import { CurrentTokenPair } from '../../entities/currentTokenPair.entity';
import { UsedRefreshTokens } from '../../entities/usedRefreshTokens.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserSchema, CurrentTokenPair, UsedRefreshTokens]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        UserService,
        JwtService,
        JwtAuthService,
        Repository
    ],
})

export class AuthModule { }