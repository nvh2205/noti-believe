import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'tokens' })
export class Token {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Token ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({ name: 'coin_name' })
  @ApiProperty({
    description: 'Name of the token',
    example: 'Sample Token',
  })
  coin_name: string;

  @Column({ name: 'coin_ticker' })
  @ApiProperty({
    description: 'Ticker symbol of the token',
    example: 'STKN',
  })
  coin_ticker: string;

  @Column({ name: 'ca_address', unique: true })
  @ApiProperty({
    description: 'Contract address of the token',
    example: '0x1234567890123456789012345678901234567890',
  })
  ca_address: string;

  @Column({ name: 'pair_address', unique: true })
  @ApiProperty({
    description: 'Pair address of the token',
    example: '0x1234567890123456789012345678901234567890',
  })
  pair_address: string;

  @Column({ name: 'twitter_handler', nullable: true })
  @ApiProperty({
    description: 'Twitter handle of the token creator',
    example: 'sampletoken',
  })
  twitter_handler: string;

  @Column({ name: 'website', nullable: true })
  @ApiProperty({
    description: 'Website URL of the token',
    example: 'https://example.com',
  })
  website: string;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 30,
    scale: 18,
    default: 0,
  })
  @ApiProperty({
    description: 'Current price of the token',
    example: 0.00001234,
  })
  price: number;

  @Column({
    name: 'initial_price',
    type: 'decimal',
    precision: 30,
    scale: 18,
    default: 0,
  })
  @ApiProperty({
    description: 'Initial price of the token when first discovered',
    example: 0.00001234,
  })
  initial_price: number;

  @Column({
    name: 'market_cap',
    type: 'decimal',
    precision: 30,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'Current market capitalization of the token',
    example: 1000000.0,
  })
  market_cap: number;

  @Column({
    name: 'initial_market_cap',
    type: 'decimal',
    precision: 30,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'Initial market capitalization when first discovered',
    example: 1000000.0,
  })
  initial_market_cap: number;

  @Column({ name: 'message_id', nullable: true })
  @ApiProperty({
    description: 'Telegram message ID for this token alert',
    example: '123456789',
  })
  message_id: string;

  @Column({ name: 'twitter_info', type: 'jsonb' })
  @ApiProperty({
    description: 'Twitter information about the token creator',
    example: {
      name: 'Sample Token',
      followers_count: 1000,
      is_blue_verified: false,
      score: '80',
      fake_percent: '20',
      top_followers: [
        {
          name: 'Top Follower 1',
          twitter: '@topfollower1',
          score: '90',
        },
      ],
    },
  })
  twitter_info: {
    name?: string;
    followers_count?: number;
    is_blue_verified?: boolean;
    score?: string;
    fake_percent?: string;
    top_followers?: Array<{
      name?: string;
      twitter?: string;
      score?: string;
    }>;
  };

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({
    description: 'Token creation timestamp',
    example: '2024-03-20T10:30:00Z',
  })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-03-20T10:30:00Z',
  })
  updated_at: Date;
}
