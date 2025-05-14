import { MessageMenu, PhotoMenu } from './menu';

export type PageResponse = {
  text: string;
  menu: MessageMenu;
};

export type PhotoResponse = {
  photo: any;
  menu: PhotoMenu;
};
