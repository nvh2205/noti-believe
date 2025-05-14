import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@/shared/pagination/pagination.interface';

export class UserInfoResponseDto {
  @ApiProperty({
    description: 'Status code of the response',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'User information retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User data',
    example: {
      id: 'uuid-string',
      address: '0x1234567890123456789012345678901234567890',
      total_points: 100,
      win_streaks: 2,
      amount_turns_free: 0,
    },
  })
  data: {
    id: string;
    address: string;
    total_points: number;
    win_streaks: number;
    amount_turns_free: number;
  };

  @ApiProperty({
    description: 'Response timestamp',
    example: '2023-06-15T10:30:00Z',
  })
  timestamp: string;
}

export class UserInfoErrorResponseDto {
  @ApiProperty({
    description: 'Status code of the response',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'User not found',
  })
  message: string;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2023-06-15T10:30:00Z',
  })
  timestamp: string;
} 