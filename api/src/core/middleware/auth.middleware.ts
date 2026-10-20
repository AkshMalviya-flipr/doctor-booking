import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

/**
 * AuthMiddleware validates JWT access tokens on incoming requests.
 * It extracts the token from the `Authorization` header (Bearer scheme) or
 * from cookies (named `access_token`). If a valid token is found, the decoded
 * payload is attached to `req['user']` for downstream handlers.
 *
 * Invalid, expired, or missing tokens will cause an `UnauthorizedException`
 * to be thrown, which Nest will translate into a 401 response.
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(private readonly jwtService: JwtService) { }

  use(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined;

    // 1. Extract token from Authorization header (Bearer ...)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback: extract token from cookies (access_token)
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cur) => {
        const [key, val] = cur.trim().split('=');
        if (key && val) acc[key] = val;
        return acc;
      }, {} as Record<string, string>);
      token = cookies['access_token'];
    }

    if (!token) {
      // No token found – you may allow unauthenticated routes elsewhere
      this.logger.warn('No authentication token provided');
      return next();
    }

    try {
      const decoded = this.jwtService.verify<Record<string, unknown>>(token, {
        secret: process.env.JWT_SECRET,
      });
      // Attach decoded payload to request for later use (e.g., guards, controllers)
      (req as any).user = decoded;
    } catch (err) {
      this.logger.error('Invalid or expired JWT token', err instanceof Error ? err.stack : err);
      throw new UnauthorizedException('Authentication token is missing or invalid');
    }

    next();
  }
}
