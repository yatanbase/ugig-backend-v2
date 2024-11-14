import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Game } from '../games/entities/game.entity';
import { Player } from '../player/player.entity';

export enum MoveType {
  SELECT = 'select',
  PREDICT = 'predict',
}

@Entity()
export class Move {
  @PrimaryGeneratedColumn()
  moveId: number;

  @ManyToOne(() => Game, (game) => game.moves, { onDelete: 'CASCADE' }) // Important: Cascade deletion
  game: Game;

  @ManyToOne(() => Player, (player) => player.moves)
  player: Player;

  @Column({ nullable: true }) // Only for predictions and when turn is just assigned
  tilePosition: string; // E.g., '0-0', '7-7'

  @Column({
    type: 'enum',
    enum: MoveType,
  })
  type: MoveType;

  @Column({ nullable: true }) // Only for predictions
  isCorrect?: boolean;
}
