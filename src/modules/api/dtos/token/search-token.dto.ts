import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginateDto } from '@/shared/pagination/paginate.dto';

export class SearchTokenDto extends PaginateDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (tên, symbol, mint address)' })
  @IsOptional()
  @IsString()
  keyword?: string;
} 