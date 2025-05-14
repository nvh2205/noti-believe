import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IPaginateRequest } from './pagination.interface';
import {
  MAX_PAGINATION_TAKEN,
  MIN_PAGINATION_TAKEN,
  PAGINATION_TAKEN,
} from './constants';
import { RequireWith } from '../validator/decorators/requireWith';

export enum ESortType {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginateDto implements IPaginateRequest {
  @ApiPropertyOptional({
    name: 'take',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Max(MAX_PAGINATION_TAKEN)
  @Min(MIN_PAGINATION_TAKEN)
  take?: number = PAGINATION_TAKEN;

  @ApiPropertyOptional({
    name: 'page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @RequireWith(['sort_type'])
  sort_field?: string;

  @ApiPropertyOptional({
    type: 'enum',
    enum: ESortType,
  })
  @IsOptional()
  @IsIn(Object.values(ESortType))
  // @RequireWith(['sort_field'])
  sort_type: ESortType = ESortType.DESC;
}
