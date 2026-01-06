const sendToSocket = (ws, event, data) => {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ event, data }));
  }
};

const sendError = (ws, message) => {
  sendToSocket(ws, 'ERROR', { message });
};

const broadcastToRoom = (roomSockets, event, data, excludeSocket = null) => {
  for (const socket of roomSockets) {
    if (socket !== excludeSocket && socket.readyState === 1) {
      sendToSocket(socket, event, data);
    }
  }
};

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
