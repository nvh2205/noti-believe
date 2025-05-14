import { ApiProperty } from '@nestjs/swagger';

export class DailyPriceDto {
  @ApiProperty({
    description: 'ISO string timestamp',
    example: '2023-05-07T12:00:00.000Z'
  })
  t: string;
  
  @ApiProperty({
    description: 'Cryptocurrency symbol',
    example: 'BTC'
  })
  s: string;
  
  @ApiProperty({
    description: 'Highest price in the time period',
    example: 30500.5
  })
  high: number;
  
  @ApiProperty({
    description: 'Opening price in the time period',
    example: 30000.25
  })
  open: number;
  
  @ApiProperty({
    description: 'Closing price in the time period',
    example: 30200.75
  })
  close: number;
  
  @ApiProperty({
    description: 'Lowest price in the time period',
    example: 29800.5
  })
  low: number;
  
  @ApiProperty({
    description: 'Trading volume in the time period',
    example: 1250.75
  })
  volume: number;
}

export class DailyPriceResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200
  })
  statusCode: number;
  
  @ApiProperty({
    description: 'Response message',
    example: 'Success'
  })
  message: string;
  
  @ApiProperty({
    description: 'BTC price data, maximum 180 entries',
    type: [DailyPriceDto]
  })
  data: DailyPriceDto[];
  
  @ApiProperty({
    description: 'Response timestamp',
    example: '2023-05-07T12:05:30.123Z'
  })
  timestamp: string;
} 