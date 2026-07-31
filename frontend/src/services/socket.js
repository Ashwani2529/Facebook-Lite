import { io } from 'socket.io-client';
import SERVER_URL from '../server_url';

let socket;

export const getSocket = () => {
  const token = localStorage.getItem('jwt');

  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
  }

  socket.auth = { token };
  return socket;
};

export const connectSocket = () => {
  const activeSocket = getSocket();
  if (!activeSocket.connected) activeSocket.connect();
  return activeSocket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = undefined;
};
