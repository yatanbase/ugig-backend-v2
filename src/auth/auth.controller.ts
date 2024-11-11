import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreatePlayerDto } from '../player/dto/create-player.dto'; // Create this DTO
import { LocalAuthGuard } from './local-auth.guard'; // Create this guard
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createPlayerDto: CreatePlayerDto) {
    await this.authService.signup(createPlayerDto);
    return { message: 'Signup successful!' };
  }

  @UseGuards(LocalAuthGuard) // Use the local strategy for username/password login
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user); // req.user will be populated by the LocalStrategy
  }

  @UseGuards(AuthGuard('jwt')) // Protect this route with JWT
  @Post('profile')
  getProfile(@Request() req) {
    // The user is available in req.user thanks to the JwtStrategy
    return req.user;
  }
}
