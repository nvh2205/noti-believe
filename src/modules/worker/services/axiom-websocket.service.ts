import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import WebSocket from 'ws';

@Injectable()
export class AxiomWebSocketService implements OnModuleInit, OnModuleDestroy {
  private client: WebSocket;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private pingInterval: NodeJS.Timeout;

  constructor(
    @InjectPinoLogger(AxiomWebSocketService.name)
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    // this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    try {
      this.logger.info(
        '🔄 [AxiomWebSocketService] connect: Connecting to Axiom Trade WebSocket',
      );

      // Configure WebSocket with the required origin and host headers
      this.client = new WebSocket('wss://cluster3.axiom.trade/', {
        headers: {
          'Origin': 'https://axiom.trade',
          'Host': 'cluster3.axiom.trade',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          Cookie:
            'auth-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiMTQ5ZjZhYjItMDY2MS00YjI2LThmNTgtYzVhOTE2MTQ2NjQ1IiwiaWF0IjoxNzQ3MjQ0NjE5LCJleHAiOjE3NDcyNDU1Nzl9.1snkuuhbYqexBBaMXfR4gKqkapHEqnAyfaEeKhFVTgo; auth-refresh-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6IjJlMDU2NzBkLTBlZWYtNDJkNi05NGNjLTFmMzk2NTQwZDhhNyIsImlhdCI6MTc0NzE5NjM1M30.l5qzWDGXf16fk3RfYxZmSx1ovOrU6Z5uiR25GgHwCts',
        },
      });

      this.client.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.info(
          '✅ [AxiomWebSocketService] connect: Connected to Axiom Trade WebSocket',
        );

        // Setup ping interval to keep connection alive
        // this.setupPingInterval();

        // Subscribe to necessary channels or send auth messages here
        this.subscribe();
      });

      this.client.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.logger.error(
            { error, data: data.toString() },
            '🔴 [AxiomWebSocketService] message: Error parsing WebSocket message',
          );
        }
      });

      this.client.on('error', (error) => {
        this.logger.error(
          { error },
          '🔴 [AxiomWebSocketService] error: WebSocket error',
        );
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.clearPingInterval();
        this.logger.warn(
          '⚠️ [AxiomWebSocketService] close: WebSocket connection closed',
        );

        // Attempt to reconnect
        this.handleReconnect();
      });
    } catch (error) {
      this.logger.error(
        { error },
        '🔴 [AxiomWebSocketService] connect: Error connecting to WebSocket',
      );
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.info(
        {
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts,
        },
        '🔄 [AxiomWebSocketService] handleReconnect: Attempting to reconnect',
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      this.logger.error(
        '🔴 [AxiomWebSocketService] handleReconnect: Max reconnect attempts reached',
      );
    }
  }

  private disconnect() {
    if (this.client) {
      this.clearPingInterval();
      this.client.close();
      this.isConnected = false;
      this.logger.info(
        '🔄 [AxiomWebSocketService] disconnect: Disconnected from WebSocket',
      );
    }
  }

  private setupPingInterval() {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.client.readyState === WebSocket.OPEN) {
        this.client.ping();
        this.logger.debug(
          '🔍 [AxiomWebSocketService] setupPingInterval: Ping sent',
        );
      }
    }, 30000); // 30 seconds
  }

  private clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  private subscribe() {
    if (!this.isConnected || this.client.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        '⚠️ [AxiomWebSocketService] subscribe: Cannot subscribe, not connected',
      );
      return;
    }

    // Join the new_pairs room
    const joinMessage = JSON.stringify({
      action: 'join',
      room: 'new_pairs',
    });

    this.client.send(joinMessage);
  }

  private handleMessage(message: any) {
    this.logger.debug(
      { message },
      '🔍 [AxiomWebSocketService] handleMessage: Received message',
    );

    // Implement message handling logic based on Axiom Trade WebSocket API
    // This would dispatch different types of messages to appropriate handlers

    // Example:
    // if (message.type === 'trade') {
    //   this.handleTradeMessage(message);
    // } else if (message.type === 'orderbook') {
    //   this.handleOrderBookMessage(message);
    // }
  }

  // Public methods to interact with the WebSocket service

  /**
   * Send a message to the Axiom Trade WebSocket server
   * @param message The message to send
   * @returns A boolean indicating whether the message was sent successfully
   */
  public sendMessage(message: any): boolean {
    if (!this.isConnected || this.client.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        { message },
        '⚠️ [AxiomWebSocketService] sendMessage: Cannot send message, not connected',
      );
      return false;
    }

    try {
      this.client.send(JSON.stringify(message));
      this.logger.debug(
        { message },
        '🔍 [AxiomWebSocketService] sendMessage: Message sent',
      );
      return true;
    } catch (error) {
      this.logger.error(
        { error, message },
        '🔴 [AxiomWebSocketService] sendMessage: Error sending message',
      );
      return false;
    }
  }

  /**
   * Check if the WebSocket connection is active
   * @returns A boolean indicating whether the connection is active
   */
  public isActive(): boolean {
    return this.isConnected && this.client?.readyState === WebSocket.OPEN;
  }

  /**
   * Force a reconnection to the WebSocket server
   */
  public reconnect(): void {
    this.logger.info(
      '🔄 [AxiomWebSocketService] reconnect: Forcing reconnection',
    );
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}
