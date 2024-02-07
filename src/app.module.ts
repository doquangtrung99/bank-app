import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/account/account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from './config';
import { CurrentAccountSchema, SavingsAccountSchema } from './entities/account.entity';
import { UserSchema } from './entities/user.entity';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CurrentTokenPair } from './entities/currentTokenPair.entity';
import { UsedRefreshTokens } from './entities/usedRefreshTokens.entity';
import { JwtAuthModule } from './modules/jwt/jwt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'trung123',
      database: 'test',
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
    JwtAuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { };

// TypeOrmModule.forRootAsync({
//   imports: [ConfigModule],
//   useFactory: (configService: ConfigService) => ({
//     type: 'mysql',
//     host: configService.get<string>('HOST'),
//     port: parseInt(configService.get<string>('PORT_DB')),
//     username: configService.get<string>('USER_NAME_DB'),
//     password: configService.get<string>('PORT_DB'),
//     database: configService.get<string>('DB'),
//     entities: [CurrentAccount],
//     synchronize: true,
//   }),
//   inject: [ConfigService],
// }),