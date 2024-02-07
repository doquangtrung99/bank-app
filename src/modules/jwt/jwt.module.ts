// jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthService } from './jwt.service';
import { jwtConstants } from '../auth/constants';

@Module({
    imports: [
        JwtModule.register({}),
    ],
    providers: [JwtAuthService],
    exports: [JwtModule],
})
export class JwtAuthModule { }
