import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { CurrentAccountSchema, SavingsAccountSchema } from './account.entity';

@Entity()
export class UserSchema {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    identificationType: string;

    @Column()
    identificationNumber: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    mobileNumber: string;

    @Column()
    country: string;

    @Column({ type: 'longblob' })
    proofOfIdentity: string;

    @OneToOne(() => CurrentAccountSchema, (currentAccount) => currentAccount.user)
    currentAccounts?: CurrentAccountSchema

    @OneToOne(() => SavingsAccountSchema, (currentAccount) => currentAccount.user)
    savingsAccounts?: SavingsAccountSchema

}
