import { ParseMode } from 'node-telegram-bot-api';

export type Menu = {
  text: string;
  callback_data: string;
  url?: string;
  web_app?: any;
};

export type MessageMenu = {
  parse_mode?: ParseMode | undefined;
  disable_web_page_preview?: boolean;
  message_auto_delete_time?: number;
  reply_markup:
    | { inline_keyboard: Menu[][] }
    | { keyboard: KeyboardOption[][] }
    | ForceReplyOption;
};

export type KeyboardOption = {
  text: string;
};

export type ForceReplyOption = {
  force_reply: boolean;
  input_field_placeholder?: string | undefined;
  selective?: boolean | undefined;
};

export type PhotoMenu = {
  parse_mode?: ParseMode | undefined;
  disable_web_page_preview?: boolean;
  reply_markup: { inline_keyboard: Menu[][] };
  caption: string;
};
