'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== 'undefined' ? window.location.origin : '');
    socket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });
    
    socket.on('connect', () => {
      console.log('Socket.io connected:', socket?.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

