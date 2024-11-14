import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Move } from './moves.entity';
import { MovesService } from './moves.service';
import { Player } from 'src/player/player.entity';
import { Game } from 'src/games/entities/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Move, Player, Game])],
  providers: [MovesService],
  exports: [MovesService],
})
export class MovesModule {}
