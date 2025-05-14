import { Inject } from '@nestjs/common';
import { CallbackHandler, StartHandler } from '../handlers/start.handler';
import { Handler } from '../handlers/handler';
import { COMMAND_KEYS, USER_INPUT } from '../constants';
import { UserInputHandler } from '../handlers/user-input.handler';

export class HandlerService {
  @Inject(StartHandler)
  private startHandler: StartHandler;

  @Inject(UserInputHandler)
  private userInputHandler: UserInputHandler;

  @Inject(CallbackHandler)
  private callbackHandler: CallbackHandler;

  getHandlers(): Record<string, Handler> {
    return {
      [COMMAND_KEYS.START]: this.startHandler,
      [USER_INPUT]: this.userInputHandler,
      [COMMAND_KEYS.LINK_WALLET]: this.callbackHandler,
    };
  }
}
