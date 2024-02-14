// jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthService } from './jwt.service';

@Module({
    imports: [
        JwtModule.register({}),
    ],
    providers: [JwtAuthService],
    exports: [JwtModule],
})
export class JwtAuthModule { }
