import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BaseResponse } from '@/shared/swagger/response/base.response';
import { PaginationResponse } from '@/shared/pagination/pagination.interface';
import { Transform } from 'class-transformer';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of users per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class LeaderboardUserDto {
  @ApiProperty({
    description: 'User wallet address',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Total points accumulated by the user',
    example: 150,
  })
  @IsNumber()
  total_points: number;

  @ApiProperty({
    description: 'Current win streak of the user',
    example: 3,
  })
  @IsNumber()
  win_streaks: number;

  @ApiProperty({
    description: 'Rank position on the leaderboard',
    example: 1,
  })
  @IsNumber()
  rank: number;
}

export class LeaderboardResponseDto extends BaseResponse<LeaderboardUserDto[]> {
  @ApiProperty({
    description: 'List of users ordered by total points',
    type: [LeaderboardUserDto],
  })
  data: LeaderboardUserDto[];

  @ApiPropertyOptional({
    description: 'Pagination information',
    type: PaginationResponse,
  })
  pagination?: PaginationResponse;
}

export class LeaderboardErrorResponseDto extends BaseResponse<null> {
  @ApiProperty({
    description: 'Error message',
    example: 'Failed to retrieve leaderboard data',
  })
  msg: string;
} 