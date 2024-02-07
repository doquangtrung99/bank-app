import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
interface Payload {
    userId: string
    username: string
    email: string
    role: string
}
@Injectable()
export class JwtAuthService {
    constructor(private readonly jwtService: JwtService) { }

    async generateToken(payload: Payload, options: JwtSignOptions): Promise<string> {
        return await this.jwtService.signAsync(payload, options);
    }

    async verifyToken(token: string, secret: string): Promise<any> {
        return this.jwtService.verify(token,
            {
                secret
            });
    }
}
