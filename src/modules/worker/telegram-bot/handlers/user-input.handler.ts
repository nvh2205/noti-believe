import { Inject, Injectable } from '@nestjs/common';
import { ChatId } from 'node-telegram-bot-api';
import { TelegramBot } from '../telegram-bot';
import { Handler } from './handler';

@Injectable()
export class UserInputHandler implements Handler {
  @Inject(TelegramBot)
  private readonly bot: TelegramBot;

  // @Inject(SecurityBoxService)
  // private readonly securityBoxService: SecurityBoxService;

  constructor() {}

  handler = async (data: {
    chatId: ChatId;
    telegramId: string;
    messageId: number;
    text: string;
    reply_to_message_id: number;
  }) => {
    try {
    } catch (error) {
      console.error(error);
    }
  };
}
