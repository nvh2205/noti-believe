import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

export class GetNonceQueryDto {
  @ApiProperty({
    description: 'Ethereum address of wallet (used for Binance Wallet)',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  address: string;
}

export class VerifySignatureDto {
  @ApiProperty({
    description: 'Ethereum address of wallet (used for Binance Wallet)',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Signed message',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
  })
  access_token: string;

  @ApiProperty({
    description: 'UserPoint information',
  })
  user: {
    id: string;
    username: string;
    email: string;
    address: string;
  };
}

export class LoginWithTokenDto {
  @ApiProperty({
    description: 'Token from Telegram bot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class LoginWithTokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ'
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'User ethereum address',
        example: '0x1234567890123456789012345678901234567890'
      },
      telegram_id: {
        type: 'string',
        description: 'Telegram user ID',
        example: '123456789'
      },
      telegram_username: {
        type: 'string',
        description: 'Telegram username',
        example: 'username'
      },
      telegram_avatar_url: {
        type: 'string',
        description: 'Telegram avatar URL',
        example: 'https://t.me/i/userpic/320/username.svg'
      }
    }
  })
  user: {
    address: string;
    telegram_id: string;
    telegram_username: string;
    telegram_avatar_url: string;
  };
}
