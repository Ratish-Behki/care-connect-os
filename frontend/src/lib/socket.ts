import { io, Socket } from 'socket.io-client';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

let emergencySocket: Socket | null = null;

function getSocketOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

export function getEmergencySocket() {
  if (!emergencySocket) {
    emergencySocket = io(getSocketOrigin(), {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  return emergencySocket;
}

export function disconnectEmergencySocket() {
  if (emergencySocket) {
    emergencySocket.disconnect();
    emergencySocket = null;
  }
}
