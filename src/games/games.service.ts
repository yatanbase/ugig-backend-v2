// games/games.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameState } from './entities/game.entity';
import { Player } from 'src/player/player.entity';
import { PlayerService } from '../player/player.service'; // Import your PlayersService

import { In } from 'typeorm';
@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    private playersService: PlayerService, // Inject PlayerService
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
    console.log(
      `updateGameState called with gameId: ${gameId}, state: ${state}`,
    );
    const game = await this.getGame(gameId);
    if (!game) {
      console.error(`Game with id ${gameId} not found`);
      throw new Error('Game not found');
    }
    game.state = state;
    const updatedGame = await this.gameRepository.save(game);
    console.log(
      `Game state updated successfully for gameId: ${gameId}, new state: ${state}`,
    );
    return updatedGame;
  }

  async setWinner(gameId: number, winnerUsername: string): Promise<Game> {
    console.log(
      `setWinner called with gameId: ${gameId}, winnerUsername: ${winnerUsername}`,
    );
    const game = await this.getGame(gameId);
    if (!game) {
      console.error(`Game with id ${gameId} not found`);
      throw new Error('Game not found');
    }

    const winnerPlayer = await this.playerRepository.findOneBy({
      username: winnerUsername,
    });
    if (!winnerPlayer) {
      console.error(`Winner player with username ${winnerUsername} not found`);
      throw new Error('Winner player not found');
    }
    game.winnerPlayer = winnerPlayer; // Set the winnerPlayer relation

    const updatedGame = await this.gameRepository.save(game);
    console.log(
      `Winner set successfully for gameId: ${gameId}, winnerUsername: ${winnerUsername}`,
    );
    return updatedGame;
  }
  // In your GamesService (games.service.ts):
  async getGamesHistory(playerId: number): Promise<Game[]> {
    return this.gameRepository.find({
      where: {
        players: {
          id: playerId, // Find games where this player is in the players array
        },
      },
      relations: ['players', 'winnerPlayer'], // Load the relations as needed
      order: { startAt: 'DESC' }, // Sort by start date, most recent first
    });
  }
  // ... other methods (e.g., for updating game details, finding games by player, etc.)
}
