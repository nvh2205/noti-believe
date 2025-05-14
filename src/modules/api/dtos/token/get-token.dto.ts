import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsSolanaAddress } from '@/shared/validator/decorators/isSolanaAddress';

export class GetTokenDto {
  @ApiProperty({ description: 'Mint address của token' })
  @IsNotEmpty()
  @IsString()
  @IsSolanaAddress()
  address: string;
}