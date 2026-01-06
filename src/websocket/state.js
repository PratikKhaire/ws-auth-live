const rooms = new Map();

const conversationMessages = new Map();

const getRoom = (roomName) => {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  return rooms.get(roomName);
};

const joinRoom = (roomName, ws) => {
  const room = getRoom(roomName);
  room.add(ws);
  ws.rooms.add(roomName);
};

const leaveRoom = (roomName, ws) => {
  if (rooms.has(roomName)) {
    const room = rooms.get(roomName);
    room.delete(ws);
    ws.rooms.delete(roomName);

    if (room.size === 0) {
      rooms.delete(roomName);
    }
  }
};

const leaveAllRooms = (ws) => {
  if (ws.rooms) {
    for (const roomName of ws.rooms) {
      leaveRoom(roomName, ws);
    }
  }
};

const getRoomSockets = (roomName) => {
  return rooms.get(roomName) || new Set();
};

const roomExists = (roomName) => {
  return rooms.has(roomName) && rooms.get(roomName).size > 0;
};

const initConversationMessages = (conversationId) => {
  if (!conversationMessages.has(conversationId)) {
    conversationMessages.set(conversationId, []);
  }
};

const addMessage = (conversationId, message) => {
  initConversationMessages(conversationId);
  conversationMessages.get(conversationId).push(message);
};

const getConversationMessages = (conversationId) => {
  return conversationMessages.get(conversationId) || [];
};

const clearConversationMessages = (conversationId) => {
  conversationMessages.delete(conversationId);
};

const deleteRoom = (roomName) => {
  if (rooms.has(roomName)) {
    const room = rooms.get(roomName);
    for (const ws of room) {
      ws.rooms.delete(roomName);
    }
    rooms.delete(roomName);
  }
};

const getRoomName = (conversationId) => {
  return `conversation:${conversationId}`;
};

module.exports = {
  rooms,
  conversationMessages,
  getRoom,
  joinRoom,
  leaveRoom,
  leaveAllRooms,
  getRoomSockets,
  roomExists,
  initConversationMessages,
  addMessage,
  getConversationMessages,
  clearConversationMessages,
  deleteRoom,
  getRoomName
};
