import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreatePlayerDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' }) // Example validation
  password: string;
}
