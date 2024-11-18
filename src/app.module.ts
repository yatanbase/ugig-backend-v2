import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JwtModule } from '@nestjs/jwt';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GamesController } from './games/games.controller'; // Import GamesController
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { AuthModule } from './auth/auth.module'; // Correctly import AuthModule
import { Player } from './player/player.entity';
import { PlayerService } from './player/player.service';
import { GamesModule } from './games/games.module';
import { PlayerModule } from './player/player.module'; // Import PlayerModule
import { Game } from './games/entities/game.entity';
import { PassportModule } from '@nestjs/passport';
import { GamesService } from './games/games.service';
import { Move } from './moves/moves.entity';
import { MovesModule } from './moves/moves.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Player, Game, Move],
        synchronize: true,
        emitDecoratorMetadata: true,
      }),

      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Player, Game, Move]),
    AuthModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        // Asynchronous factory function
        secret: configService.get<string>('JWT_SECRET'), // Access the configuration value
        signOptions: { expiresIn: '1d' }, // Token expiration time
      }),
      inject: [ConfigService], // Inject the ConfigService int the factory fn
    }),
    GamesModule,
    PlayerModule,
    MovesModule,
  ],

  controllers: [AppController, GamesController],
  providers: [AppService, GameGateway, PlayerService],
})
export class AppModule {}
