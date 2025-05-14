export * from './menu';
export * from './response';
export * from './state';

/**
 * Represents a peer that reacted to a message
 */
export interface MessagePeerReaction {
  peer_id: number | string;
  reaction: string | { type: 'custom_emoji'; custom_emoji_id: string } | { type: 'paid' };
  date: number;
}

/**
 * Represents a user in the Telegram API response
 */
export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  [key: string]: any;
}

/**
 * Represents a chat in the Telegram API response
 */
export interface Chat {
  id: number;
  title?: string;
  username?: string;
  type: string;
  [key: string]: any;
}

/**
 * Response structure for messages.getMessageReactionsList
 */
export interface MessageReactionsList {
  count: number;
  reactions: MessagePeerReaction[];
  chats: Chat[];
  users: User[];
  next_offset?: string;
}
