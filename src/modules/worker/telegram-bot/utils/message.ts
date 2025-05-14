import {
  ForceReplyOption,
  KeyboardOption,
  Menu,
  MessageMenu,
  PhotoMenu,
} from '../types';

export enum EParseMode {
  HTML = 'HTML',
  MarkdownV2 = 'MarkdownV2',
}
export const buildMessageOptions = (
  tableButtons: Menu[][],
  parse_mode: EParseMode = EParseMode.HTML,
): MessageMenu => {
  const inlineKeyboardMarkup = {
    inline_keyboard: tableButtons,
  };
  return {
    reply_markup: { ...inlineKeyboardMarkup },
    parse_mode: parse_mode,
    disable_web_page_preview: true,
  };
};

export const buildMessageWithKeyboardOptions = (
  keyboardOptions: KeyboardOption[][],
  parse_mode: EParseMode = EParseMode.HTML,
): MessageMenu => {
  const keyboardMarkup = {
    keyboard: keyboardOptions,
  };
  return {
    reply_markup: { ...keyboardMarkup },
    parse_mode: parse_mode,
    disable_web_page_preview: true,
  };
};

export const buildMessageWithForceReply = (
  input_field_placeholder?: string,
  parse_mode: EParseMode = EParseMode.HTML,
): MessageMenu => {
  return {
    reply_markup: { input_field_placeholder, force_reply: true },
    parse_mode: parse_mode,
    disable_web_page_preview: true,
  };
};

export const buildPhotoOptions = (
  tableButtons: Menu[][],
  text: string,
): PhotoMenu => {
  const inlineKeyboardMarkup = { inline_keyboard: tableButtons };
  return {
    reply_markup: { ...inlineKeyboardMarkup },
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    caption: text,
  };
};
