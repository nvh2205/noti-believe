import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ITokenPopularResponse {
  @ApiPropertyOptional()
  logoURI: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  supply: number;
}
