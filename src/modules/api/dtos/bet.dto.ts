import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum BetTypeEnum {
  BUY = 'buy',
  SELL = 'sell',
}

export class BetRequestDto {
  @ApiProperty({
    description: 'Type of the bet',
    enum: BetTypeEnum,
    example: BetTypeEnum.BUY,
    enumName: 'BetTypeEnum',
  })
  @IsEnum(BetTypeEnum)
  @IsNotEmpty()
  type: BetTypeEnum;
}

export class BetResponseDto {
  @ApiProperty({
    description: 'Success status of the bet operation',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Unique identifier for the bet',
    example: '123456',
  })
  betId: number;

  @ApiProperty({
    description: 'Timestamp when the bet was placed',
    example: '2023-06-15T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Initial price at the time the bet was placed',
    example: 50000.25,
  })
  initialPrice: number;

  @ApiProperty({
    description: 'Informational message about the bet',
    example: 'Your BUY bet has been placed. Result will be processed in 5 seconds.',
  })
  message: string;
}

export class BetErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'User has no snap game price set',
  })
  message: string;

  @ApiProperty({
    description: 'Error code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error timestamp',
    example: '2023-06-15T10:30:00Z',
  })
  timestamp: string;
} 