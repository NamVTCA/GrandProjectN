import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AccountType } from '../schemas/user.schema';

@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    return user.accountType === AccountType.PREMIUM;
  }
}
