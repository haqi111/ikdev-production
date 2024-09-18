import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/auth/types';


export const GetCurrentUserEmail = createParamDecorator(
  (_: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!user || !user.email) {
      throw new Error('User email not found in request');
    }
    return user.email;
  },
);
