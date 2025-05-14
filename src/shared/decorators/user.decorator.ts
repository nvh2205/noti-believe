import { TJWTPayload } from '@/shared/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TJWTPayload => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request?.user || {
        sub:
          !process.env.APP_ENV || process.env.APP_ENV === 'local'
            ? '445df5bd-425a-4316-9548-1804a988d055'
            : undefined,
      }
    );
  },
);
