import TelegramBotApi, {
  ChatId,
  SendMessageOptions,
} from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { PageResponse, PhotoResponse, TelegramBotState } from './types';
import {
  parserCallbackMessageTelegram,
  parserMessageTelegram,
} from './utils/telegram';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { COMMAND_KEYS } from './constants/command-keys';
import { USER_INPUT } from './constants/index';
import { Handler } from './handlers/handler';
import process from 'process';
import Redis from 'ioredis';
import { parseCommand } from './utils';
import { isURL } from 'class-validator';

@Injectable()
export class TelegramBot implements OnApplicationBootstrap {
  name: string;
  public telegramIdStatus: Record<string, number> = {};

  public bot: TelegramBotApi;

  private handlers: Record<string, Handler>;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('telegram.token');
    this.bot = new TelegramBotApi(token, {
      polling: true,
      request: {
        family: 4, // Force IPv4 only
      },
    });
  }

  onApplicationBootstrap() {
    // Get bot name
    this.bot.getMe().then((res) => {
      this.name = res.username;
      console.log(
        '🚀 ~ file: telegram-bot.ts:53 ~ TelegramBot ~ onApplicationBootstrap ~ this.name:',
        this.name,
      );
    });
  }

  async sendMessage(
    chatId: ChatId,
    text: string,
    options?: SendMessageOptions,
  ) {
    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      console.log({
        msg: '🚀 ~ file: telegram-bot.ts:89 ~ error:',
        error: error?.message,
        chatId,
        text,
      });
    }
  }
  
  /**
   * Edit an existing message
   * @param chatId Chat ID where the message is
   * @param messageId Message ID to edit
   * @param text New text for the message
   * @param options Message options
   * @returns Promise with the edited message
   */
  async editMessage(
    chatId: ChatId,
    messageId: number,
    text: string,
    options?: SendMessageOptions,
  ) {
    try {
      return await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options,
      });
    } catch (error) {
      console.log({
        msg: '🚀 ~ file: telegram-bot.ts ~ editMessage ~ error:',
        error: error?.message,
        chatId,
        messageId,
        text,
      });
      throw error;
    }
  }

  async sendPageMessage(chatId: ChatId, data: PageResponse) {
    try {
      return this.bot.sendMessage(chatId, data.text, data.menu);
    } catch (error) {
      console.log('🚀 ~ file: telegram-bot.ts:97 ~ error:', error);
    }
  }

  async sendPagePhoto(chatId: ChatId, data: PhotoResponse) {
    try {
      return await this.bot.sendPhoto(chatId, data.photo, data.menu);
    } catch (error) {
      console.log('🚀 ~ file: telegram-bot.ts:105 ~ error:', error?.message);
    }
  }

  async deleteMessage(chatId: ChatId, messageId: number, seconds = 0) {
    const timeout = setTimeout(async () => {
      try {
        await this.bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.log(
          '🚀 ~ file: telegram-bot.ts:131 ~ TelegramBot ~ timeout ~ error:',
          error,
        );
      }
      clearTimeout(timeout);
    }, seconds * 1000);
  }

  /**
   * Answer a callback query to acknowledge the button press
   * @param callbackQueryId The ID of the callback query to answer
   * @param text Optional text to show the user
   * @param showAlert Whether to show as an alert instead of a notification
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert: boolean = false,
  ) {
    try {
      await this.bot.answerCallbackQuery(callbackQueryId, {
        text,
        show_alert: showAlert,
      });
    } catch (error) {
      console.log('🔴 Error answering callback query:', error?.message);
    }
  }

  /**
   * Handle token action button callbacks (Refresh Token, Insight Analysis)
   * @param callback Custom callback function to process the token actions
   */
  setupTokenActionCallbacks(
    callback: (
      action: string,
      tokenAddress: string,
      query: any,
    ) => Promise<void>,
  ) {
    this.bot.on('callback_query', async (query) => {
      const { data } = query;

      // Handle our custom button callbacks for token actions
      if (
        data &&
        (data.startsWith('refresh_token:') ||
          data.startsWith('insight_analysis:'))
      ) {
        const [action, tokenAddress] = data.split(':');
        if (tokenAddress) {
          await callback(action, tokenAddress, query);
        }
        return;
      }

      // Continue with existing callback handling
      let action = data;
      let parsedData = parserCallbackMessageTelegram(query);

      if (action.startsWith('link_wallet:')) {
        action = COMMAND_KEYS.LINK_WALLET;
        parsedData = { ...parsedData, callbackData: query.data };
      }

      if (this.handlers) {
        const { cmd: _cmd, params } = parseCommand(action);
        const handler = this.handlers[_cmd];
        if (handler) {
          if (params && (handler as any)?.setConfig) {
            (handler as any).setConfig(params);
          }
          handler
            .handler(parsedData)
            .then()
            .catch((e) => {
              console.error(e, {
                file: 'TelegramBot.setupTokenActionCallbacks',
                text: `handler command ${_cmd} error: `,
              });
            });
        } else {
          console.log('unknown callback:', { _cmd });
        }
      }
    });
  }

  getAvatarUrl(telegramUsername: string) {
    return `https://t.me/i/userpic/320/${telegramUsername}.svg`;
  }

  setupStartCommand(callback: any) {
    this.bot.onText(/\/start/, (msg) => {
      callback(parserMessageTelegram(msg));
    });
  }

  setupMenuCallback(callback: any) {
    this.bot.on('callback_query', (query) => {
      let { data: action } = query;

      let data = parserCallbackMessageTelegram(query);
      if (action.startsWith('link_wallet:')) {
        action = COMMAND_KEYS.LINK_WALLET;
        data = { ...data, callbackData: query.data };
      }
      // const data = query;
      callback(action, data);
    });
  }

  userReply(callback: any) {
    this.bot.on('message', (msg) => {
      if (isURL(msg.text)) {
        this.bot.sendMessage(msg.chat.id, 'open this', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  web_app: {
                    url: msg.text,
                  },
                  text: '🔫',
                },
              ],
            ],
          },
        });
      }
      callback(parserMessageTelegram(msg));
    });
  }

  registerHandlers(handlers: Record<string, Handler>) {
    this.handlers = handlers;
  }

  async start() {
    const startHandler = this.handlers[COMMAND_KEYS.START];

    if (startHandler) {
      this.setupStartCommand(startHandler.handler);
    }

    this.setupMenuCallback((cmd, data) => {
      const { cmd: _cmd, params } = parseCommand(cmd);
      const handler = this.handlers[_cmd];
      if (handler) {
        if (params && (handler as any)?.setConfig) {
          (handler as any).setConfig(params);
        }
        handler
          .handler(data)
          .then()
          .catch((e) => {
            console.error(e, {
              file: 'TelegramBot.start',
              text: `handler command ${_cmd} error: `,
            });
          });
      } else {
        console.log('unknown callback:', { _cmd });
      }
    });

    this.userReply(this.handlers[USER_INPUT].handler);
  }

  /**
   *
   * @param telegramId
   * @returns
   */
  async getUrlAvatar(telegramId: number) {
    const result = await this.bot.getUserProfilePhotos(telegramId, 0 as any); // TODO: recheck
    const fileId =
      result.photos.length > 0 && result.photos[0].length > 0
        ? result.photos[0][0].file_id
        : null;

    if (!fileId) {
      return null;
    }

    const link = await this.bot.getFileLink(fileId);
    const avatarLink = link.toString();

    return avatarLink;
  }

  async getCheckMember(chatId: ChatId, userId: number) {
    const checkMember = await this.bot.getChatMember(chatId, userId);
    return checkMember;
  }
}
