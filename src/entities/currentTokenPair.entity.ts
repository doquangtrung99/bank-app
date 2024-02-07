
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('current_token_pair')
export class CurrentTokenPair {

    @PrimaryColumn()
    userId: string;

    @Column({ type: "varchar", name: 'access_token', length: 1000 })
    accessToken: string;

    @Column({ type: "varchar", name: 'refresh_token', length: 1000 })
    refreshToken: string;
}
