import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PackageType } from '../enums/package.enum';
import { BaseResponse } from '@/shared/swagger/response/base.response';

export class BuyPackageRequestDto {
  @ApiProperty({
    description: 'The package type to purchase',
    enum: PackageType,
    example: PackageType.ONE_NFT,
    enumName: 'PackageType'
  })
  @IsEnum(PackageType)
  @IsNotEmpty()
  package: PackageType;
}

export class PackageResponseDataDto {
  @ApiProperty({
    description: 'The transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  transaction_id: string;

  @ApiProperty({
    description: 'The package type purchased',
    enum: PackageType,
    example: PackageType.ONE_NFT
  })
  package: string;

  @ApiProperty({
    description: 'The amount of NFTs in the package',
    example: 1
  })
  amount_nft: number;

  @ApiProperty({
    description: 'The amount of turns gained',
    example: 1
  })
  amount_turns: number;

  @ApiProperty({
    description: 'The total price paid',
    example: 1.5
  })
  total_price: number;

  @ApiProperty({
    description: 'The user wallet address',
    example: '0xabcdef1234567890abcdef1234567890abcdef12'
  })
  address: string;

  @ApiProperty({
    description: 'The transaction status',
    example: 'success'
  })
  status: string;

  @ApiProperty({
    description: 'The transaction hash',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  })
  hash: string;
}

export class BuyPackageResponseDto extends BaseResponse<PackageResponseDataDto> {
  @ApiProperty({
    description: 'Response data for buy package',
    type: () => PackageResponseDataDto
  })
  data: PackageResponseDataDto;
}

export class BuyPackageErrorResponseDto extends BaseResponse<null> {
  @ApiProperty({
    description: 'Error response for buy package',
    example: null
  })
  data: null;
} 