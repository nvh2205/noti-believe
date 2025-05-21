import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Token } from '../entities/token.entity';

@Injectable()
export class TokenRepository extends Repository<Token> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(Token, dataSource.createEntityManager());
  }
}
