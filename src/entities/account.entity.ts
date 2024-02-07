
import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne } from 'typeorm';
import { UserSchema } from './user.entity';
import { ACCOUNT_TYPE } from '../constants';

@Entity('current_account')
export class CurrentAccountSchema {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "varchar" })
    userId: string;

    @Column({ type: 'bigint' })
    accountNumber: number;

    @Column({
        type: "enum",
        enum: ACCOUNT_TYPE
    })
    type: string;

    @Column({ type: 'int', default: 0 })
    balance: number;

    @OneToOne(() => UserSchema, (user) => user.currentAccounts)
    @JoinColumn({ name: 'userId' })
    user?: UserSchema

}


@Entity('savings_account')
export class SavingsAccountSchema {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: "bigint" })
    accountNumber: number;

    @Column({
        type: "enum",
        enum: ACCOUNT_TYPE
    })
    type: string;

    @Column({ type: 'int', default: 0 })
    balance: number;

    @OneToOne(() => UserSchema, (user) => user.savingsAccounts)
    @JoinColumn({ name: 'userId' })
    user?: UserSchema

}
