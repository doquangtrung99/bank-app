import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from '../../entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtAuthService } from '../jwt/jwt.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    imports: [TypeOrmModule.forFeature([UserSchema])],
    controllers: [UserController],
    providers: [UserService, JwtAuthService, JwtService],
})

export class UserModule { }