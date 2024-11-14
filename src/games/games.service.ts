// games/games.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameState } from './entities/game.entity';
import { Player } from 'src/player/player.entity';
import { In } from 'typeorm';
@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async createGame(playerUsernames: string[]): Promise<Game> {
    const players = await this.playerRepository.findBy({
      username: In(playerUsernames),
    });

    if (players.length !== playerUsernames.length) {
      throw new Error('Some players were not found.');
    }

    const newGame = this.gameRepository.create({
      players,
      state: GameState.WAITING,
    }); // Initialize state

    return this.gameRepository.save(newGame);
  }

  async getGame(gameId: number): Promise<Game | undefined> {
    return this.gameRepository.findOne({
      // Use findOne to find by gameId
      where: { gameId },
      relations: ['players', 'winnerPlayer'], // Eagerly load relations
    });
  }

  async updateGameState(gameId: number, state: GameState): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    game.state = state;
    return this.gameRepository.save(game);
  }

  async setWinner(gameId: number, winnerUsername: string): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const winnerPlayer = await this.playerRepository.findOneBy({
      username: winnerUsername,
    });
    if (!winnerPlayer) {
      throw new Error('Winner player not found');
    }
    game.winnerPlayer = winnerPlayer; // Set the winnerPlayer relation

    return this.gameRepository.save(game);
  }

  // ... other methods (e.g., for updating game details, finding games by player, etc.)
}
