/**
 * WebSocket utility functions
 */

/**
 * Send a message to a single socket
 */
const sendToSocket = (ws, event, data) => {
  if (ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify({ event, data }));
  }
};

/**
 * Send error message to socket
 */
const sendError = (ws, message) => {
  sendToSocket(ws, 'ERROR', { message });
};

/**
 * Broadcast to all sockets in a room except sender
 */
const broadcastToRoom = (roomSockets, event, data, excludeSocket = null) => {
  for (const socket of roomSockets) {
    if (socket !== excludeSocket && socket.readyState === 1) {
      sendToSocket(socket, event, data);
    }
  }
};

/**
 * Broadcast to all sockets in a room (including sender)
 */
const broadcastToRoomAll = (roomSockets, event, data) => {
  for (const socket of roomSockets) {
    if (socket.readyState === 1) {
      sendToSocket(socket, event, data);
    }
  }
};

module.exports = {
  sendToSocket,
  sendError,
  broadcastToRoom,
  broadcastToRoomAll
};
