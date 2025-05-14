import { WebSocketGateway as NestWebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Server } from 'socket.io';

@NestWebSocketGateway({
  cors: {
    origin: '*', // In production, you would want to restrict this
  },
  // transports: ['websocket'],
})
export class WebSocketGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectPinoLogger(WebSocketGateway.name)
    private readonly logger: PinoLogger,
  ) {}

  handleConnection(client: any) {
    this.logger.info({ clientId: client.id }, 'Client connected');
  }

  handleDisconnect(client: any) {
    this.logger.info({ clientId: client.id }, 'Client disconnected');
  }

  /**
   * Emit bet result to clients
   * @param userAddress The user's address to use in the event name
   * @param betResult The bet result data
   */
  emitBetResult(userAddress: string, betResult: any) {
    this.logger.info(
      { userAddress, betResult },
      'Emitting bet result'
    );
    this.server.emit(`bet:result:${userAddress}`, betResult);
  }
}