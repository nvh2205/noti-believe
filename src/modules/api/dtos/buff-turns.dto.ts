import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { BaseResponse } from '@/shared/swagger/response/base.response';

export class BuffTurnsRequestDto {
  @ApiProperty({
    description: 'The Ethereum address of the user',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Number of free turns to add to the user',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount_turn: number;
}

export class BuffTurnsResponseDataDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'The Ethereum address of the user',
    example: '0x1234567890123456789012345678901234567890',
  })
  address: string;

  @ApiProperty({
    description: 'Number of free turns after update',
    example: 10,
  })
  amount_turns_free: number;

  @ApiProperty({
    description: 'Total points of the user',
    example: 100,
  })
  total_points: number;

  @ApiProperty({
    description: 'Win streaks of the user',
    example: 2,
  })
  win_streaks: number;
}

export class BuffTurnsResponseDto extends BaseResponse<BuffTurnsResponseDataDto> {}

export class BuffTurnsErrorResponseDto extends BaseResponse<null> {} 