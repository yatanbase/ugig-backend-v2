// game.gateway.ts
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt'; // Import JwtService

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly jwtService: JwtService) {
    console.log(' server instance in GameGateway', this.server);
  }
  private onlineUsers: Set<string> = new Set(); // Back to Set for simplicity

  afterInit(server: Server) {
    console.log('Server initialized. Clearing online users list.');
    this.onlineUsers.clear(); // Clear the onlineUsers Set when the server starts
    this.emitUserList(); //Emit an empty user list to any connected clients immediately after server start
  }

  async handleConnection(client: Socket) {
    try {
      // Get and verify JWT from connection headers
      console.log('client', client);
      const token = client.handshake.headers.authorization?.split(' ')[1]; // "Bearer <token>"
      console.log('token', token);
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      console.log('here', decoded);

      if (decoded) {
        // Store username if JWT is valid

        this.onlineUsers.add(decoded.username);
        console.log(`Client connected: ${decoded.username}`);

        this.emitUserList();
      }
    } catch (error) {
      // Handle invalid token (disconnect client or other action)
      console.log('invalid token provided by user');
      client.disconnect();
    }
  }
  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    //   const gameId = this.onlineUsers.get(client.id);
    this.onlineUsers.delete(client.id);
    this.emitUserList(); // Remove the user and update the list
  }

  //   @SubscribeMessage('joinGame')
  //   async handleJoinGame(
  //     @ConnectedSocket() client: Socket,
  //     @MessageBody('gameId') gameId: string,
  //   ) {
  //     client.join(gameId);
  //     console.log(`Client ${client.id} joined game: ${gameId}`);
  //     this.onlineUsers.set(client.id, gameId);
  //     this.emitUserList(gameId); // Update and emit the user list upon joining
  //     client.emit('joinedGame', { gameId });
  //   }

  async emitUserList() {
    // const clientsInRoom = await this.server.fetchSockets();
    // const onlineUsersInRoom = clientsInRoom.map((c) => c.id);
    // this.server.emit('updateUserList', onlineUsersInRoom);
    this.server.emit('updateUserList', Array.from(this.onlineUsers));
  }

  @SubscribeMessage('getOnlineUsers')
  getOnlineUsers() {
    // No need for client parameter
    this.emitUserList(); // Emit the general user list to all clients
  }

  @SubscribeMessage('selectCell')
  handleSelectCell(
    @MessageBody() cell: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1]; // "Bearer <token>"
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      // Now emits username instead of client ID

      client.broadcast.emit('cellSelected', {
        cell,
        username: decoded.username,
      });
    } catch (error) {
      client.disconnect();
    }
  }
}
