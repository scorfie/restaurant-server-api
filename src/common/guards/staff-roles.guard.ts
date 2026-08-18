import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../../auth/auth.types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class StaffRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) ?? [];

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (user?.type !== 'staff' || !roles.includes(user.role as string)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }
    return true;
  }
}
