import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller'; // Create this next
import { PlayerModule } from '../player/player.module'; // Create this shortly
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy'; // We'll create this later
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../player/player.entity';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    PlayerModule,
    PassportModule,
    JwtModule.register({
      secret: 'secret', // Use environment variable
      signOptions: { expiresIn: '1d' }, // Example expiration time
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
