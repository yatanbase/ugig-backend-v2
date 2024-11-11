import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './player.entity';
import { PlayerService } from './player.service'; // Create this

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  providers: [PlayerService],
  exports: [PlayerService], // So AuthModule can use it
})
export class PlayerModule {}
