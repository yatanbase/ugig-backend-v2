// games/game.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Player } from '../../player/player.entity';
import { Move } from '../../moves/moves.entity';

export enum GameState {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  ROUND_OVER = 'round_over',
  GAME_OVER = 'game_over',
  PAUSED = 'paused',
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  gameId: number;

  @Column({
    type: 'enum',
    enum: GameState,
    default: GameState.WAITING,
  })
  state: GameState;

  @ManyToOne(() => Player, (player) => player.wonGames, { nullable: true }) // Assuming Player entity has wonGames field
  winnerPlayer: Player | null; // Optional: Winner of the game

  @ManyToMany(() => Player, (player) => player.games)
  @JoinTable() // Creates a join table automatically
  players: Player[];

  @OneToMany(() => Move, (move) => move.game)
  moves: Move[];

  //Consider adding array if winner can have more than one players
  // @Column('simple-array',{nullable: true})
  // winnerPlayerId: number[]; // Storing an array of winner player IDs

  @CreateDateColumn()
  startAt: Date;

  @UpdateDateColumn()
  endAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
