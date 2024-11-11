import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PlayerService } from '../player/player.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private playerService: PlayerService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // payload is the data encoded in the JWT
    const user = await this.playerService.findOneByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    // The validated user object will be available through request.user
    return user;
  }
}
