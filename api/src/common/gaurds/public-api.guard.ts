import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

/**
 * PublicApiGuard
 *
 * This guard protects public API endpoints by ensuring that an
 * Authorization header containing a JWT token (or API key) is present.
 * It does **not** validate the token's contents – that responsibility
 * should be delegated to a dedicated authentication service. The guard
 * simply blocks requests that lack the required credential, returning a
 * 401 Unauthorized response.
 */
@Injectable()
export class PublicApiGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Allow routes marked with @Public() to bypass auth
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = this.getRequest(context);
    const authHeader =
      request?.headers?.['authorization'] ||
      request?.headers?.['Authorization'];

    if (!authHeader) {
      // No token supplied – reject the request.
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Token is present – allow the request to proceed.
    return true;
  }

  /**
   * Extracts the underlying HTTP request from the ExecutionContext.
   * Supports both HTTP and GraphQL contexts.
   */
  private getRequest(context: ExecutionContext): Request {
    if ((context.getType() as string) === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext()?.req;
    }
    return context.switchToHttp().getRequest();
  }
}
