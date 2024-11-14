import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JwtModule } from '@nestjs/jwt';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { AuthModule } from './auth/auth.module'; // Correctly import AuthModule
import { Player } from './player/player.entity';
import { PlayerService } from './player/player.service';
import { GamesModule } from './games/games.module';
import { PlayerModule } from './player/player.module'; // Import PlayerModule
import { Game } from './games/entities/game.entity';

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
      }),

      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Player]),
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    GamesModule,
    PlayerModule,
    MovesModule,
  ],

  controllers: [AppController],
  providers: [AppService, GameGateway, PlayerService],
})
export class AppModule {}
