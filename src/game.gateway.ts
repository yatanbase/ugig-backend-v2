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
  private userSockets = new Map<string, Socket>(); // Map to store user sockets

  afterInit(server: Server) {
    console.log('Server initialized. Clearing online users list.');
    this.onlineUsers.clear(); // Clear the onlineUsers Set when the server starts
    this.userSockets.clear(); // Clear the userSockets Map when the server starts
    this.emitUserList(); //Emit an empty user list to any connected clients immediately after server start
  }

  async handleConnection(client: Socket) {
    try {
      // Get and verify JWT from connection headers
      // console.log('client', client);
      console.log('jwt secret', process.env.JWT_SECRET);
      const token = client.handshake.headers.authorization?.split(' ')[1]; // "Bearer <token>"
      console.log('token', token);
      const decoded = this.jwtService.verify(token, {
        secret: 'secret',
      });

      console.log('here', decoded);
      if (decoded) {
        // Check if the username already has an active connection
        if (this.userSockets.has(decoded.username)) {
          console.log(
            `Username ${decoded.username} already has an active connection. Disconnecting new client ${client.id}`,
          );
          client.disconnect();
          return;
        }

        // Store username if JWT is valid and no active connection exists
        this.userSockets.set(decoded.username, client);
        this.onlineUsers.add(decoded.username);
        console.log(`Client ${client.id} connected as ${decoded.username}`);
        console.log(`Client connected: ${decoded.username}`);

        this.emitUserList();
      }
    } catch (error) {
      // Handle invalid token (disconnect client or other action)
      console.log('invalid token provided by user', error);
      client.disconnect();
    }
  }
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // Remove user from onlineUsers if present. Use username from JWT if possible.
    if (client.handshake.headers.authorization) {
      try {
        const token = client.handshake.headers.authorization?.split(' ')[1]; // "Bearer <token>"

        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        this.userSockets.delete(decoded.username); // Remove user from map

        this.onlineUsers.delete(decoded.username);
        console.log(`Client disconnected: ${decoded.username}`);
      } catch (error) {
        // ... error handling (optional) - client was probably not authenticated
        console.log('Error during disconnection:', error);
      }
    }
    this.emitUserList();
    console.log(`Client disconnected: ${client.id}`);
    // Remove the user and update the list
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

  @SubscribeMessage('sendInvite')
  handleSendInvite(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('data', data);
    console.log('client.id', client.id);
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1]; // "Bearer <token>"

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      if (!decoded) {
        throw new Error('Invalid token');
      }
      // Log the username sending the invite
      const recipientSocket = this.userSockets.get(data.to);
      console.log('Recipient socket:', recipientSocket?.id);
      if (recipientSocket) {
        recipientSocket.emit('receiveInvite', { from: decoded.username });

        client.emit('inviteResponse', {
          // Respond to sender
          success: true,
          message: 'Invite sent successfully',
          to: data.to,
        });

        console.log(`Invite from ${decoded.username} sent to ${data.to}`);
      } else {
        client.emit('inviteResponse', {
          // Respond to sender with error
          success: false,
          message: 'User not found or offline',
          to: data.to,
        });
        console.log(`User ${data.to} not found or offline.`);
      }
    } catch (error) {
      console.error('Error in sendInvite:', error); // Detailed error logging
      client.emit('inviteResponse', {
        success: false,
        message: error.message, // Send specific error message
        to: data.to,
      });
      client.disconnect();
    }
  }

  @SubscribeMessage('acceptInvite')
  async handleAcceptInvite(
    @MessageBody() data: { from: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Accepting invite from:', data.from);
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const roomId = `room-${data.from}-${decoded.username}`; // Create room ID using usernames
      console.log('Room ID created: ', roomId);
      client.join(roomId);
      console.log(
        `User ${decoded.username} with id ${client.id} joined room: ${roomId}`,
      ); // Log with username
      const joinroomrecipientSocket = this.userSockets.get(data.from);
      console.log('joinroomrecipientSocket', joinroomrecipientSocket);
      client.to(joinroomrecipientSocket.id).emit('joinRoom', { roomId }); // Tell 'from' user to join
      console.log(`${joinroomrecipientSocket.id} ko send kiya joinRoom `);
      return roomId; // Return roomId
    } catch (error) {
      console.error('Error accepting invite', error);
      client.disconnect();
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const { roomId } = data;

      client.join(roomId);
      console.log(`User ${decoded.username} joined room: ${roomId}`); // Log with username

      client.emit('joinedRoom', { roomId });
      client.to(roomId).emit('joinedRoom', { roomId });
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('selectCell')
  handleSelectCell(
    @MessageBody() data: { cell: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1]; // "Bearer <token>"
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      // Now emits username instead of client ID

      client
        .to(data.roomId)
        .emit('cellSelected', { cell: data.cell, username: decoded.username });
    } catch (error) {
      client.disconnect();
    }
  }
}
