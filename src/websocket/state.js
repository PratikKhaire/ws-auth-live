/**
 * In-Memory State Management for WebSocket
 *
 * rooms: Map of room names to Set of WebSocket connections
 * conversationMessages: Map of conversation IDs to array of messages
 */

// Room tracking: { "conversation:c200": Set<WebSocket> }
const rooms = new Map();

// Message storage (until conversation closes): { "c200": Array<Message> }
const conversationMessages = new Map();

/**
 * Get or create a room
 */
const getRoom = (roomName) => {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  return rooms.get(roomName);
};

/**
 * Add a socket to a room
 */
const joinRoom = (roomName, ws) => {
  const room = getRoom(roomName);
  room.add(ws);
  ws.rooms.add(roomName);
};

/**
 * Remove a socket from a room
 */
const leaveRoom = (roomName, ws) => {
  if (rooms.has(roomName)) {
    const room = rooms.get(roomName);
    room.delete(ws);
    ws.rooms.delete(roomName);

    // Delete room if empty
    if (room.size === 0) {
      rooms.delete(roomName);
    }
  }
};

/**
 * Remove socket from all rooms
 */
const leaveAllRooms = (ws) => {
  if (ws.rooms) {
    for (const roomName of ws.rooms) {
      leaveRoom(roomName, ws);
    }
  }
};

/**
 * Get all sockets in a room
 */
const getRoomSockets = (roomName) => {
  return rooms.get(roomName) || new Set();
};

/**
 * Check if room exists
 */
const roomExists = (roomName) => {
  return rooms.has(roomName) && rooms.get(roomName).size > 0;
};

/**
 * Initialize conversation messages array
 */
const initConversationMessages = (conversationId) => {
  if (!conversationMessages.has(conversationId)) {
    conversationMessages.set(conversationId, []);
  }
};

/**
 * Add a message to conversation
 */
const addMessage = (conversationId, message) => {
  initConversationMessages(conversationId);
  conversationMessages.get(conversationId).push(message);
};

/**
 * Get all messages for a conversation
 */
const getConversationMessages = (conversationId) => {
  return conversationMessages.get(conversationId) || [];
};

/**
 * Clear messages for a conversation
 */
const clearConversationMessages = (conversationId) => {
  conversationMessages.delete(conversationId);
};

/**
 * Delete a room and clean up
 */
const deleteRoom = (roomName) => {
  if (rooms.has(roomName)) {
    const room = rooms.get(roomName);
    for (const ws of room) {
      ws.rooms.delete(roomName);
    }
    rooms.delete(roomName);
  }
};

/**
 * Get room name for a conversation
 */
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
