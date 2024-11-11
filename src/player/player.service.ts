import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async create(playerData: Partial<Player>): Promise<Player> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(playerData.password, saltOrRounds);

    const newPlayer = this.playerRepository.create({
      ...playerData,
      password: hashedPassword,
    });
    return this.playerRepository.save(newPlayer);
  }

  async findOneByEmail(email: string): Promise<Player | undefined> {
    return this.playerRepository.findOneBy({ email });
  }

  async findOneByUsername(username: string): Promise<Player | undefined> {
    return this.playerRepository.findOneBy({ username });
  }

  // ...other methods for updating, deleting, etc.
}
