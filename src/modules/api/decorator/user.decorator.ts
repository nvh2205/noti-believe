import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    if (process.env.APP_ENV === 'local') {
      return '27afb6cc-6533-4a81-a820-269b74f92476';
    }
    const request = ctx.switchToHttp().getRequest();
    return request?.user?.sub || null;
  },
);
