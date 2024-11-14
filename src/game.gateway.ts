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
import { GamesService } from './games/games.service';
import { Server, Socket } from 'socket.io';
import { MoveType } from './moves/moves.entity';
import { MovesService } from './moves/moves.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(
    private readonly jwtService: JwtService,
    private readonly gamesService: GamesService,
    private readonly movesService: MovesService, // Inject
  ) {
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
      const game = await this.gamesService.createGame([
        data.from,
        decoded.username,
      ]); // Create a game record

      console.log('game created with players ', game.players);
      client.join(roomId);
      console.log(
        `User ${decoded.username} with id ${client.id} joined room: ${roomId}`,
      ); // Log with username

      // Set gameId in client data for future reference
      client.data.gameId = game.gameId;

      // Emit 'joinedRoom' to the current client, including gameId
      client.emit('joinedRoom', { roomId, gameId: game.gameId });
      console.log(`joinedRoom sent to ${client.id} `);
      const joinroomrecipientSocket = this.userSockets.get(data.from);
      if (joinroomrecipientSocket) {
        console.log('joinroomrecipientSocket', joinroomrecipientSocket.id);
        client
          .to(joinroomrecipientSocket.id)
          .emit('joinRoom', { roomId, gameId: game.gameId }); // Tell 'from' user to join
        console.log(
          `${joinroomrecipientSocket.id} ko send kiya joinRoom with gameId ${game.gameId} and roomId ${roomId}`,
        );
        return roomId; // Return roomId
      } else {
        // Handle the case where the inviting user is offline.  You might want to
        // send a message back to the accepting user or handle it differently.
        console.log(`User ${data.from} not found or offline.`);
        client.emit('inviteError', { message: 'The other player is offline.' });
        return;
      }
    } catch (error) {
      console.error('Error accepting invite', error);
      client.disconnect();
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; username: string },
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

      // const gameId = client.adapter.rooms.get(roomId)?.gameId;
      //For all server instances
      const sockets = await this.server.in(roomId).fetchSockets();
      const gameId = sockets[0].data.gameId;

      console.log('gameId in handleJoin', gameId);
      client.data.gameId = gameId;
      client.emit('joinedRoom', { roomId, gameId });
      client.to(roomId).emit('joinedRoom', { roomId, gameId });

      this.createTurn(roomId, gameId, data.username); // initiate turn after join
      console.log('createTurn called after joinRoom');
    } catch (error) {
      client.disconnect();
    }
  }

  async createTurn(
    roomId: string,
    gameId: number,
    joiningUsername: string, // to create initial turn after joining
    // client: Socket,
  ) {
    console.log(
      `[createTurn] Starting createTurn for roomId: ${roomId}, gameId: ${gameId}, joiningUsername: ${joiningUsername}`,
    );
    const moves = await this.movesService.getMovesByGame(gameId);
    console.log(`[createTurn] Retrieved moves for gameId: ${gameId}`, moves);
    let selector: string;
    let predictor: string;

    if (moves.length === 0) {
      console.log(`[createTurn] First turn for gameId: ${gameId}`);
      // First move: randomly assign selector and predictor
      const players = await this.gamesService
        .getGame(gameId)
        .then((g) => g.players.map((p) => p.username));
      console.log(`[createTurn] Players in gameId: ${gameId}`, players);

      const randomIndex = Math.floor(Math.random() * 2);
      selector = players[randomIndex];
      predictor = players[1 - randomIndex];
      console.log(
        `[createTurn] Randomly assigned selector: ${selector}, predictor: ${predictor} for gameId: ${gameId}`,
      );

      // await this.movesService.createMove(
      //   gameId,
      //   selector,
      //   null,
      //   MoveType.SELECT,
      // );
      // console.log(
      //   `[createTurn] Created initial move for selector: ${selector} in gameId: ${gameId}`,
      // );
    } else {
      console.log(`[createTurn] Subsequent turn for gameId: ${gameId}`);
      // all other turns

      const sortedMoves = moves.sort((a, b) => b.moveId - a.moveId);
      const lastMove = sortedMoves[0]; // Get the most recent move
      console.log(`[createTurn] Last move for gameId: ${gameId}`, lastMove);

      const players = await this.gamesService
        .getGame(gameId)
        .then((g) => g.players.map((p) => p.username));
      console.log(`[createTurn] Players in gameId: ${gameId}`, players);

      selector =
        lastMove.player.username === players[0] ? players[1] : players[0];
      predictor =
        lastMove.player.username === players[0] ? players[0] : players[1];
      console.log(
        `[createTurn] Assigned selector: ${selector}, predictor: ${predictor} for gameId: ${gameId}`,
      );

      // await this.movesService.createMove(
      //   gameId,
      //   selector,
      //   null,
      //   MoveType.SELECT,
      // );
      // console.log(
      //   `[createTurn] Created move for selector: ${selector} in gameId: ${gameId}`,
      // );
    }

    // Emit 'turn' event with roles
    this.server.to(roomId).emit('turn', { selector, predictor, gameId });
    console.log(
      `[createTurn] Emitted 'turn' event for roomId: ${roomId}, gameId: ${gameId} with selector: ${selector}, predictor: ${predictor}`,
    );
  }

  @SubscribeMessage('selectCell')
  async handleSelectCell(
    @MessageBody() data: { cell: string; roomId: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log('data in selectCell subscribe', data);
      const token = client.handshake.headers.authorization?.split(' ')[1]; // "Bearer <token>"
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      // Now emits username instead of client ID
      const gameId = client.data.gameId;
      const { cell, roomId, username } = data;
      console.log('gameId in handleSelectCell', gameId);
      const move = await this.movesService.createMove(
        gameId,
        username,
        cell,
        MoveType.SELECT,
      );

      client
        .to(data.roomId)
        .emit('cellSelected', { cell: data.cell, username });
      console.log(
        'log after selectCell subscribe ends and cellSelected emitted',
      );
      this.createTurn(roomId, gameId, username); // creates next turn
    } catch (error) {
      client.disconnect();
    }
  }
}
