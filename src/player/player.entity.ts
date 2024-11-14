import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Game } from '../games/entities/game.entity';
import { Move } from '../moves/moves.entity';

@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Store the hashed password

  @Column({ unique: true })
  username: string;

  @OneToMany(() => Move, (move) => move.player) // Relationship to Move
  moves: Move[];

  @OneToMany(() => Game, (game) => game.winnerPlayer) // One-to-many relationship: A player can win multiple games
  wonGames: Game[];

  @ManyToMany(() => Game, (game) => game.players)
  games: Game[];

  // @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  // createdAt: Date;

  // @Column({
  //   type: 'timestamp',
  //   default: () => 'CURRENT_TIMESTAMP',
  //   onUpdate: 'CURRENT_TIMESTAMP',
  // })
  // updatedAt: Date;

  // @Column({ type: 'timestamp', nullable: true })
  // deletedAt: Date;
}
