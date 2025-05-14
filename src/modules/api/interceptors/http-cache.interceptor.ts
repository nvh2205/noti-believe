import { ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import SHA256 from 'crypto-js/sha256';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpAdapterHost, Reflector } from '@nestjs/core';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: any,
    protected readonly httpAdapterHost: HttpAdapterHost,
    reflector: Reflector,
    private configService: ConfigService
  ) {
    super(cacheManager, reflector);
  }

  isRequestCacheable(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const excludePaths = [
      // Routes to be excluded
      '/crypto/btc/daily-prices',
    ];
    
    // Check if the path is excluded
    if (excludePaths.includes(request.url)) {
      return false;
    }
    
    return super.isRequestCacheable(context);
  }

  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    
    // Get excluded routes from config
    const excludePaths = this.configService.get<string[]>('cache.api.exclude_routes') || [];
    
    if (
      !isGetRequest ||
      (isGetRequest &&
        excludePaths.includes(httpAdapter.getRequestUrl(request)))
    ) {
      return undefined;
    }
    
    const { query } = context.getArgByIndex(0);
    const hash = SHA256(
      JSON.stringify({
        query,
        headers: { authorization: request?.headers?.authorization },
      }),
    ).toString();
    
    return `${httpAdapter.getRequestUrl(request)}_${hash}`;
  }
}
