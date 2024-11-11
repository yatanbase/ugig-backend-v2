import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  // ... other fields (createdAt, updatedAt, deletedAt) can be added
}
