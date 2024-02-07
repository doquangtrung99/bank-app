
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('used_refresh_tokens')
export class UsedRefreshTokens {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "varchar" })
    userId: string;

    @Column({ type: "varchar", name: 'refresh_token', length: 1000 })
    refreshToken: string;
}
