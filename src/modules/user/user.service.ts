import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSchema } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from 'src/dto/user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserSchema)
        private readonly userRepository: Repository<UserSchema>
    ) { }

    async getUserByEmail(email: string): Promise<UserSchema> {
        const user = await this.userRepository.findOne({
            where: {
                email
            }
        });

        return user
    }

    async getUserByUserId(userId: string, currentUser?): Promise<UserSchema> {

        // only myself can get the data of myself
        if (currentUser && currentUser.id !== userId) {
            throw new UnauthorizedException();
        }

        const user = await this.userRepository.findOne({
            where: {
                id: userId
            },
            relations: {
                currentAccounts: true,
                savingsAccounts: true
            }
        });

        if (!user) {
            throw new NotFoundException();
        }
        delete user.password;

        return user
    }

    createUser(user: RegisterUserDto): Promise<UserSchema> {
        return this.userRepository.save(user, {
            reload: true,
        });
    }
}
