import { ChatId } from 'node-telegram-bot-api';
import { Inject, Injectable } from '@nestjs/common';
import { TelegramBot } from '../telegram-bot';
import { Handler } from './handler';
import Redis from 'ioredis';
import { LoginPage } from '../ui/pages/login.page';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class StartHandler implements Handler {
  @Inject(TelegramBot)
  private readonly bot: TelegramBot;

  @Inject('REDIS_STATE')
  private readonly redis: Redis;

  handler = async (data: {
    chatId: ChatId;
    telegramId: string;
    username: string;
    text: string;
    firstName: string;
  }) => {
    //getOrCreateUser
    const telegramAvatarUrl = this.bot.getAvatarUrl(data.username);

    //save to redis
    // const token = uuidv4();
    // await this.redis.set(
    //   `link_telegram:${token}`,
    //   JSON.stringify({
    //     telegramId: data.telegramId,

    //     username: data.username,
    //     avatarUrl: telegramAvatarUrl,
    //   }),
    //   'EX',
    //   //5 minutes
    //   60 * 5,
    // );

    // console.log('🚀 ~ StartHandler ~ handler ~ token:', token);

    // Default welcome flow
    await this.bot.sendPagePhoto(
      data.chatId,
      new LoginPage().build({
        accessToken: '',
      }),
    );
  };
}

@Injectable()
export class CallbackHandler implements Handler {
  @Inject(TelegramBot)
  private readonly bot: TelegramBot;

  handler = async (data: {
    chatId: ChatId;
    telegramId: string;
    username: string;
    callbackData: string;
    firstName: string;
  }) => {};
}
