import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

const wsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : '*';

@WebSocketGateway({
  cors: {
    origin: wsOrigin,
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private messagesService: MessagesService) {}

  afterInit() {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('connect')
  async handleConnect(@ConnectedSocket() client: Socket) {
    return { status: 'connected', clientId: client.id };
  }

  @SubscribeMessage('message:create')
  async handleMessageCreate(
    @MessageBody()
    data: { dealId: string; content: string; attachmentUrl?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { error: 'Authentication required' };
    }

    try {
      const message = await this.messagesService.createMessage(
        data.dealId,
        userId,
        data.content,
        data.attachmentUrl,
      );
      this.server.to(`deal_${data.dealId}`).emit('message:receive', message);
      return { success: true, message };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('join-deal')
  async handleJoinDeal(
    @MessageBody() data: { dealId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { error: 'Authentication required' };
    }

    try {
      client.join(`deal_${data.dealId}`);
      const messages = await this.messagesService.getMessages(
        data.dealId,
        userId,
      );
      client.emit('message:history', messages);
      return { success: true, dealId: data.dealId };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
