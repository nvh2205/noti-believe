import { CallbackQuery, Message } from 'node-telegram-bot-api';

export const parserMessageTelegram = (msg: Message) => ({
  messageId: msg.message_id,
  chatId: msg.chat.id,
  telegramId: msg.from.id,
  firstName: msg.from.first_name,
  lastName: msg.from.last_name,
  username: msg.from.username,
  text: msg.text,
  isInputMessage: !msg?.entities,
  reply_to_message_id: msg?.reply_to_message?.message_id,
});

export const parserCallbackMessageTelegram = (query: CallbackQuery) => ({
  messageId: query.message.message_id,
  chatId: query.message.chat.id,
  telegramId: query.from.id,
  firstName: query.from.first_name,
  lastName: query.from.last_name,
  username: query.from.username,
  queryId: query.id,
  callbackData: query.data,
});
