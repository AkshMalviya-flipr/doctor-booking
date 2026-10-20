import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../schemas/user.schema';

export function setAuthTokenCookie(
  res: Response,
  user: User,
  jwtService: JwtService,
): void {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwtService.sign(payload);
  const cookieName = process.env.JWT_COOKIE_NAME || 'jwt_access_token';
  const cookieMaxAge = Number(process.env.JWT_COOKIE_MAX_AGE) || 86400000;

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: cookieMaxAge,
  });
}
