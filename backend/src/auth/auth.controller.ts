import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto, loginSchema } from './dto/login.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { RegisterDto, registerSchema } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) payload: RegisterDto,
  ) {
    return this.authService.register(payload);
  }
}
