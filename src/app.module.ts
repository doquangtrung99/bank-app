import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/account/account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CurrentAccountSchema, SavingsAccountSchema } from './entities/account.entity';
import { UserSchema } from './entities/user.entity';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CurrentTokenPair } from './entities/currentTokenPair.entity';
import { UsedRefreshTokens } from './entities/usedRefreshTokens.entity';
import { JwtAuthModule } from './modules/jwt/jwt.module';
import { TransactionModule } from './modules/transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.HOST,
      port: +process.env.PORT_DB,
      username: process.env.USER_NAME_DB,
      password: process.env.PASSWORD_DB,
      database: process.env.DB,
      entities: [
        CurrentAccountSchema,
        SavingsAccountSchema,
        UserSchema,
        CurrentTokenPair,
        UsedRefreshTokens
      ],
      synchronize: true,
    }),
    AccountModule,
    UserModule,
    AuthModule,
    JwtAuthModule,
    TransactionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { };
