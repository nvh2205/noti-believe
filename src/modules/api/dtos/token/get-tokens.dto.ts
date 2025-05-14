import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsSolanaAddress } from '@/shared/validator/decorators/isSolanaAddress';

export class GetTokensDto {
  @ApiProperty({ 
    description: 'Danh sách mint address của tokens',
    isArray: true,
    example: ['address1', 'address2']
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    // Chuyển đổi input thành mảng
    let addresses = [];
    if (Array.isArray(value)) {
      addresses = value;
    } else if (typeof value === 'string') {
      addresses = [value];
    }
    
    // Loại bỏ phần tử trùng nhau bằng Set
    return [...new Set(addresses)];
  })
  @IsArray()
  @IsString({ each: true })
  @IsSolanaAddress()
  addresses: string[];
} 