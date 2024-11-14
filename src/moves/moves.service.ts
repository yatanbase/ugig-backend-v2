import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Move, MoveType } from './moves.entity';
import { Game } from '../games/entities/game.entity';
import { Player } from 'src/player/player.entity';

@Injectable()
export class MovesService {
  constructor(
    @InjectRepository(Move)
    private moveRepository: Repository<Move>,
    @InjectRepository(Player) // Inject Player repository
    private playerRepository: Repository<Player>,
    @InjectRepository(Game) // Inject Player repository
    private gameRepository: Repository<Game>,
  ) {}

  async createMove(
    gameId: number,
    playerUsername: string,
    tilePosition: string,
    type: MoveType,
    isCorrect?: boolean,
  ): Promise<Move> {
    const player = await this.playerRepository.findOneBy({
      username: playerUsername,
    });
    const game = await this.gameRepository.findOneBy({ gameId: gameId });

    const newMove = this.moveRepository.create({
      game,
      player,
      tilePosition,
      type,
      isCorrect,
    });
    return this.moveRepository.save(newMove);
  }

  async getMovesByGame(gameId: number): Promise<Move[]> {
    return this.moveRepository.find({
      where: { game: { gameId } },
      relations: ['player'],
    }); // Find by gameId
  }
}
