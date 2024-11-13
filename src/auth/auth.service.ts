import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PlayerService } from '../player/player.service';
import { CreatePlayerDto } from 'src/player/dto/create-player.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private playerService: PlayerService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(createPlayerDto: CreatePlayerDto) {
    const existingUser = await this.playerService.findOneByEmail(
      createPlayerDto.email,
    );
    if (existingUser) {
      // Throw an exception or return an appropriate error message
      throw new UnauthorizedException('Email is already registered.');
    }

    const existingUserWithUsername = await this.playerService.findOneByUsername(
      createPlayerDto.username,
    );
    if (existingUserWithUsername) {
      // Throw an exception or return an appropriate error message
      throw new UnauthorizedException('Username is already registered.');
    }

    // Hash the password before saving it if the email and username are not already registered

    const user = await this.playerService.create(createPlayerDto);

    // Hashing takes place inside PlayerService.create

    return user;
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.playerService.findOneByUsername(username);
    console.log('user in validateUser', user);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      // Exclude the password from the returned user object
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // const payload = {
    //   username: user.username,
    //   email: user.email,
    //   sub: user.id,
    // };
    // console.log('payload in login service',  'no payload'); // Include user id (sub)
    console.log('jwt in login service', process.env.JWT_SECRET); // Include user id (sub)
    console.log('jwt in login service', this.configService.get('JWT_SECRET')); // Include user id (sub)
    return {
      access_token: this.jwtService.sign(
        {
          username: user.username,
          email: user.email,
          sub: user.id,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
        },
      ),
      username: user.username,
    };
  }
}
