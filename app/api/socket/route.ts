import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { lobbyManager } from '@/lib/lobbyManager';

// Socket.io server instance'ı global olarak saklanacak
let io: SocketIOServer | null = null;

export async function GET(request: NextRequest) {
  // Bu route sadece Socket.io bağlantısını başlatmak için
  // Gerçek Socket.io server'ı custom server'da çalışacak
  return new Response('Socket.io endpoint', { status: 200 });
}

// Socket.io server'ı başlatmak için ayrı bir fonksiyon
export function initSocketIO(server: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Lobi oluşturma
    socket.on('lobby:create', (data: { gameType: string; host: string }) => {
      const lobby = lobbyManager.createLobby(
        data.gameType as any,
        data.host
      );
      socket.join(`lobby:${lobby.id}`);
      io?.emit('lobby:created', lobby);
      socket.emit('lobby:created', lobby);
    });

    // Lobiye katılma
    socket.on('lobby:join', (data: { lobbyId: string; player: string }) => {
      const lobby = lobbyManager.joinLobby(data.lobbyId, data.player);
      if (lobby) {
        socket.join(`lobby:${lobby.id}`);
        io?.to(`lobby:${lobby.id}`).emit('lobby:updated', lobby);
        io?.emit('lobby:list-updated');
      }
    });

    // Lobiden ayrılma
    socket.on('lobby:leave', (data: { lobbyId: string; player: string }) => {
      const lobby = lobbyManager.leaveLobby(data.lobbyId, data.player);
      socket.leave(`lobby:${data.lobbyId}`);
      if (lobby) {
        io?.to(`lobby:${data.lobbyId}`).emit('lobby:updated', lobby);
      }
      io?.emit('lobby:list-updated');
    });

    // Oyun başlatma
    socket.on('lobby:start', (data: { lobbyId: string }) => {
      const lobby = lobbyManager.startGame(data.lobbyId);
      if (lobby) {
        io?.to(`lobby:${lobby.id}`).emit('game:started', lobby);
      }
    });

    // Oyun hamlesi
    socket.on('game:move', (data: { lobbyId: string; move: any }) => {
      io?.to(`lobby:${data.lobbyId}`).emit('game:move', data);
    });

    // Oyun bitişi
    socket.on('game:end', (data: { lobbyId: string; result: any }) => {
      io?.to(`lobby:${data.lobbyId}`).emit('game:ended', data);
    });

    // Lobi listesi isteği
    socket.on('lobby:list', (data?: { gameType?: string }) => {
      const lobbies = lobbyManager.getAllLobbies(data?.gameType as any);
      socket.emit('lobby:list', lobbies);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

