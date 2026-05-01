import { Controller, Post, Body, Get, UseGuards, Request, Res, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ConfigService } from '@nestjs/config'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() body: { tenantName: string; email: string; password: string; ownerName: string }) {
    return this.authService.register(body)
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    return req.user
  }

  // Redirect to Google OAuth — user lands here from Login/Register button
  @Get('google')
  googleLogin(@Res() res: Response) {
    const url = this.authService.getGoogleLoginUrl()
    res.redirect(url)
  }

  // Google OAuth callback — Google redirects here after consent
  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173'
    try {
      const { token, isNew } = await this.authService.handleGoogleCallback(code)
      res.redirect(`${frontendUrl}/auth/google-callback?token=${token}&isNew=${isNew}`)
    } catch (err) {
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`)
    }
  }
}
