// games/games.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GamesService } from './games.service';
import { Player } from '../player/player.entity'; // Import Player entity
import { PlayerModule } from '../player/player.module';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Player]), PlayerModule], // Add Player to forFeature
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
