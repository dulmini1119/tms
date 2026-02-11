// src/lib/socket.ts
import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setSocketIO = (io: Server) => {
  ioInstance = io;
};

export const getSocketIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
};