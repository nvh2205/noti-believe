import { KeyboardOption, Menu } from '../types';

export const createMenuButton = (
  button: string,
  cmd?: string,
  url?: string,
  web_app?: any,
): Menu => ({
  text: button,
  ...(cmd && { callback_data: cmd }),
  url: url,
  ...(web_app && { web_app }),
});

export const createKeyboardOption = (text: string): KeyboardOption => ({
  text: text,
});

export const createMenuLabel = (label: string): Menu => ({
  text: label,
  callback_data: 'none',
});
