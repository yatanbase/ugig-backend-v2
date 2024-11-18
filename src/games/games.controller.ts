import {
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common'; // Import Request
import { GamesService } from './games.service';
import { Game } from './entities/game.entity';
import { Player } from '../player/player.entity'; // Import Game entity
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('games')
export class GamesController {
  constructor(
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    @InjectRepository(Player) // Inject Player repository
    private playerRepository: Repository<Player>, // Inject Player repository
  ) {}

  @UseGuards(AuthGuard('jwt')) // If you are protecting this route.
  @Get('history')
  async getGamesHistory(
    @Request() req,
    @Query('username') username: string,
  ): Promise<Game[]> {
    console.log('getting games history');
    const player = await this.playerRepository.findOneBy({ username }); // Get the player by username

    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return this.gamesService.getGamesHistory(player.id); // Pass player ID to the service
  }
  // constructor(private readonly gamesService: GamesService) {}
  // @Post()
  // create(@Body() createGameDto: CreateGameDto) {
  //   return this.gamesService.create(createGameDto);
  // }
  // @Get()
  // findAll() {
  //   return this.gamesService.findAll();
  // }
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.gamesService.findOne(+id);
  // }
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto) {
  //   return this.gamesService.update(+id, updateGameDto);
  // }
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.gamesService.remove(+id);
  // }
}
