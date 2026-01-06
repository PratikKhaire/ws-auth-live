# Product Requirements Document (PRD) for Live Support Chat System Backend

## Section 1 — Project Overview

### Project Name
Live Support Chat System Backend

### One-line Elevator Pitch
A robust backend system for a real-time customer support platform, enabling efficient conversation management and real-time communication via WebSocket.

### Problem Statement
Existing customer support systems often suffer from delayed responses and inefficient management, leading to poor user experiences and reduced operational efficiency.

### Why This Problem Matters (Impact)
Implementing a real-time, role-based customer support system can significantly enhance user satisfaction and improve the efficiency of support operations.

### Why This Project Fits the Hackathon Theme
This project aligns with the hackathon theme of "Innovation in Customer Support" by leveraging modern technologies like WebSocket for real-time communication and role-based access control for efficient management.

---

## Section 2 — Goals & Success Metrics

### Primary Goal (What Must Work)
- Develop a functional backend system for real-time customer support with authentication, role-based access control, and WebSocket-based messaging.

### Secondary Goals (Nice-to-Have)
- Implement admin-level analytics.
- Provide supervisor-to-agent assignment functionality.
- Ensure robust error handling and validation.

### Non-Goals (Explicit Exclusions)
- Frontend development.
- Integration with third-party CRM systems.
- Advanced AI-driven support features.

### Hackathon Success Metrics (Demo-Ready Criteria)
- All core features (authentication, role-based access, real-time messaging) must be fully functional.
- The system must be deployable and accessible for judges.
- A comprehensive demo script must be prepared.

---

## Section 3 — User Personas & Use Cases

### Target User Personas
- **Admin**: Manages the system and views analytics.
- **Supervisor**: Manages agents and assigns conversations.
- **Agent**: Handles conversations assigned by supervisors.
- **Candidate**: End user requesting support.

### Primary Use Case
- **Candidate Requests Support**: A candidate initiates a conversation with a supervisor or agent.
- **Supervisor Assigns Conversation**: A supervisor assigns a conversation to an agent.
- **Agent Handles Conversation**: An agent communicates with the candidate in real-time.

### Secondary Use Cases
- **Admin Views Analytics**: An admin views system-level analytics.
- **Agent Closes Conversation**: An agent closes a conversation after resolving the issue.

### User Journey (Step-by-Step)
1. **Candidate Requests Support**: Candidate signs up/logs in and starts a conversation.
2. **Supervisor Assigns Conversation**: Supervisor assigns the conversation to an agent.
3. **Agent Handles Conversation**: Agent joins the conversation and communicates with the candidate.
4. **Agent Closes Conversation**: Agent closes the conversation once resolved.
5. **Admin Views Analytics**: Admin views analytics on conversation handling and agent performance.

---

## Section 4 — Feature Requirements

### MUST HAVE (MVP)
- **Authentication & Authorization**
  - **Description**: Implement JWT-based authentication for all roles.
  - **User Value**: Secure access to the platform.
  - **Acceptance Criteria**: Users can sign up, log in, and access resources based on their roles.

- **Role-Based Access Control (RBAC)**
  - **Description**: Define roles (Admin, Supervisor, Agent, Candidate) with specific permissions.
  - **User Value**: Ensures that users can only perform actions appropriate to their roles.
  - **Acceptance Criteria**: System enforces role-based access control for all endpoints and WebSocket events.

- **Real-Time Messaging**
  - **Description**: Implement WebSocket-based real-time messaging.
  - **User Value**: Enables real-time communication between candidates and agents.
  - **Acceptance Criteria**: Messages are sent and received in real-time between connected clients.

### SHOULD HAVE
- **Supervisor → Agent Assignment**
  - **Description**: Allow supervisors to assign conversations to agents.
  - **User Value**: Efficient management of conversations.
  - **Acceptance Criteria**: Supervisors can assign and reassign conversations to agents.

- **Admin-Level Analytics**
  - **Description**: Provide analytics on conversation handling and agent performance.
  - **User Value**: Helps admins monitor system performance.
  - **Acceptance Criteria**: Admins can view analytics grouped by supervisor, including agent counts and conversations handled.

### NICE TO HAVE (Only if Time Allows)
- **Advanced Error Handling**
  - **Description**: Implement comprehensive error handling and validation.
  - **User Value**: Improves user experience by providing clear error messages.
  - **Acceptance Criteria**: System handles and responds to all possible error scenarios gracefully.

- **Conversation Lifecycle Management**
  - **Description**: Manage conversation states (open, assigned, closed).
  - **User Value**: Ensures conversations are properly tracked and managed.
  - **Acceptance Criteria**: Conversations transition through states correctly, and related actions are enforced.

---

## Section 5 — Technical Architecture

### High-Level Architecture
- **Backend**: Node.js with Express.js.
- **Database**: MongoDB with Mongoose.
- **Real-Time Data**: WebSocket (ws library).
- **Authentication**: JWT.
- **Encryption**: bcrypt for password hashing.

### Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Real-Time Data**: WebSocket (ws library)
- **Authentication**: JWT, bcrypt

### Data Flow
1. **HTTP Requests**: Clients interact with the backend via RESTful API.
2. **WebSocket Connections**: Clients connect to the WebSocket server for real-time messaging.
3. **Database Operations**: Backend interacts with MongoDB for data storage and retrieval.

### APIs/Services Used
- MongoDB Atlas for database storage.
- JWT for authentication tokens.

### External Dependencies
- MongoDB Atlas
- JWT library
- WebSocket library (ws)

---

## Section 6 — Backend Requirements

### HTTP API Routes

#### 1. POST `/auth/signup`
- **Request Body**:
  ```json
  {
    "name": "Rahul",
    "email": "rahul@test.com",
    "password": "secret123",
    "role": "agent",
    "supervisorId": "s100"
  }

> `supervisorId` required only if role = agent

- **Success (201)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": {
      "_id": "u101",
      "name": "Rahul",
      "email": "rahul@test.com",
      "role": "agent"
    }
  }
  ```

  

#### 2. POST `/auth/login`

- **Request Body**:

  JSON

  Copy

  ```json
  {
    "email": "rahul@test.com",
    "password": "secret123"
  }
  ```

  

- **Success (200)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": {
      "token": "JWT_TOKEN"
    }
  }
  ```

  

#### 3. GET `/auth/me`

- **Success (200)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": {
      "_id": "u101",
      "name": "Rahul",
      "email": "rahul@test.com",
      "role": "agent"
    }
  }
  ```

  

#### 4. POST `/conversations`

- **Role**: Candidate only

- **Request Body**:

  JSON

  Copy

  ```json
  {
    "supervisorId": "s100"
  }
  ```

  

- **Success (201)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": {
      "_id": "c200",
      "status": "open",
      "supervisorId": "s100"
    }
  }
  ```

  

- **Business Rules**:

  - A candidate can only have ONE active (open/assigned) conversation at a time.
  - Creating a new conversation when one already exists should return a 409 error.

#### 5. POST `/conversations/:id/assign`

- **Role**: Supervisor only

- **Request Body**:

  JSON

  Copy

  ```json
  {
    "agentId": "a101"
  }
  ```

  

- **Success (200)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": {
      "conversationId": "c200",
      "agentId": "a101",
      "supervisorId": "s100"
    }
  }
  ```

  

- **Business Rules**:

  - Supervisor can only assign agents where `agent.supervisorId` matches `supervisor._id`, otherwise return 403 with “Agent doesn’t belong to you”.
  - Supervisor can reassign conversations even if already assigned, otherwise return 403 with “cannot assign agent”.
  - Previous agent loses access to conversation.
  - Conversation status remains "open" after assignment, it’ll change later in WebSocket JOIN EVENT.

#### 6. GET `/conversations/:id`

- **Access Rules**:

  - Admin → any conversation
  - Others → only those that belong to them

- **Success (200)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": {
      "_id": "c200",
      "status": "closed",
      "agentId": "a101",
      "supervisorId": "s100",
      "candidateId": "cand1",
      "messages": [
        {
          "senderId": "cand1",
          "senderRole": "candidate",
          "content": "Hi, I need help",
          "createdAt": "2025-03-11T10:30:00.000Z"
        }
      ]
    }
  }
  ```

  

- **Business Rules**:

  - If conversation status is "assigned": return in-memory messages.
  - If conversation status is "closed": return persisted messages from MongoDB.
  - Return an empty array if no messages exist.

#### 7. POST `/conversations/:id/close`

- **Role**: Admin and supervisor only

- **Request Body**:

  JSON

  Copy

  ```json
  {}
  ```

  

- **Success (200)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": {
      "conversationId": "c200",
      "status": "closed"
    }
  }
  ```

  

- **Business Rules**:

  - Admin can close all conversations.
  - Conversation status must be "open" before closing, return 400 if status mismatch.
  - This is the case if the agent didn’t join the chat.

#### 8. GET `/admin/analytics`

- **Role**: Admin only

- **Success (200)**:

  JSON

  Copy

  ```json
  {
    "success": true,
    "data": [
      {
        "supervisorId": "s100",
        "supervisorName": "John Doe",
        "agents": 3,
        "conversationsHandled": 24
      }
    ]
  }
  ```

  

- **Business Rules**:

  - Returns analytics grouped by supervisor.
  - `agents` = count of agents under each supervisor.
  - `conversationsHandled` = count of closed conversations for all agents under that supervisor.

------

## Section 7 — WebSocket Server

### Connection Setup (Server Side)

When a client connects:

1. **Extract `token`** from query parameter.

2. **Verify JWT**:

   - If invalid → send `ERROR` event and close connection.

3. **Attach user info to socket**:

   JavaScript

   Copy

   ```javascript
   ws.user = {
     userId: decoded.userId,
     role: decoded.role
   };
   ```

   

4. Initialize socket metadata:

   JavaScript

   Copy

   ```javascript
   ws.rooms = new Set(); // rooms this socket has joined
   ```

   

### Room Model

- **One conversation = one WebSocket room**

- Room name format:

  JavaScript

  Copy

  ```javascript
  conversation:<conversationId>
  ```

  

  Example:

  JavaScript

  Copy

  ```javascript
  conversation:c200
  ```

  

### In-Memory State

#### Rooms Map

JavaScript

Copy

```javascript
const rooms = {
  "conversation:c200": Set<ws>,
  "conversation:c201": Set<ws>
};
```

#### Conversation Messages (In-Memory)

JavaScript

Copy

```javascript
const conversationMessages = {
  "c200": [
    {
      senderId: "u101",
      senderRole: "agent",
      content: "Hello",
      createdAt: "2025-03-11T10:30:00.000Z"
    }
  ]
};
```

### Rules

- Messages are stored **only in memory** during active conversation.
- Messages are **saved to MongoDB** only when conversation is closed.
- In-memory state is **cleared when conversation is closed**.

### WebSocket Message Format (GLOBAL)

**All messages (client → server and server → client) MUST use:**

JavaScript

Copy

```javascript
{
  "event": "EVENT_NAME",
  "data": {}
}
```

------

## Section 8 — WebSocket Events

### Event 1: JOIN_CONVERSATION

**Purpose:** Join a WebSocket room for a conversation **Allowed Roles:** Candidate, Agent

#### Client Sends

JavaScript

Copy

```javascript
{
  "event": "JOIN_CONVERSATION",
  "data": {
    "conversationId": "c200"
  }
}
```

#### Server Actions

**For Candidate:**

1. Verify the candidate owns the conversation, otherwise return an error with "not allowed" message.
2. Create room if not exists.
3. Add socket to room.
4. Initialize in-memory message array if not exists.

**For Agent:**

1. Verify the agent is assigned to the conversation, otherwise return an error with "not allowed" message.
2. Update conversation status to "assigned" in database.
3. Create room if not exists.
4. Add socket to room.
5. Initialize in-memory message array if not exists.

#### Success Response (Unicast)

JavaScript

Copy

```javascript
{
  "event": "JOINED_CONVERSATION",
  "data": {
    "conversationId": "c200",
    "status": "assigned"
  }
}
```

### Event 2: SEND_MESSAGE

**Purpose:** Send a chat message inside a conversation **Allowed Roles:** Candidate, Agent

#### Client Sends

JavaScript

Copy

```javascript
{
  "event": "SEND_MESSAGE",
  "data": {
    "conversationId": "c200",
    "content": "Hello, I need help"
  }
}
```

#### Server Actions

1. Verify socket has joined the room.

2. Create message object:

   JavaScript

   Copy

   ```javascript
   const message = {
     senderId: ws.user.userId,
     senderRole: ws.user.role,
     content: content,
     createdAt: new Date().toISOString()
   };
   ```

   

3. Append message to **in-memory array**.

4. Broadcast message to **all sockets in the room except the sender**.

#### Broadcast Message

JavaScript

Copy

```javascript
{
  "event": "NEW_MESSAGE",
  "data": {
    "conversationId": "c200",
    "senderId": "u101",
    "senderRole": "agent",
    "content": "Hello, I need help",
    "createdAt": "2025-03-11T10:30:00.000Z"
  }
}
```

### Event 3: LEAVE_CONVERSATION

**Purpose:** Leave a conversation room **Allowed Roles:** Candidate, Agent

#### Client Sends

JavaScript

Copy

```javascript
{
  "event": "LEAVE_CONVERSATION",
  "data": {
    "conversationId": "c200"
  }
}
```

#### Server Actions

1. Remove socket from room.
2. Remove room from `ws.rooms`.
3. Delete room if empty.

#### Success Response (Unicast)

JavaScript

Copy

```javascript
{
  "event": "LEFT_CONVERSATION",
  "data": {
    "conversationId": "c200"
  }
}
```

### Event 4: CLOSE_CONVERSATION

**Purpose:** Close a conversation and save messages to database **Allowed Roles:** Agent only

#### Client Sends

JavaScript

Copy

```javascript
{
  "event": "CLOSE_CONVERSATION",
  "data": {
    "conversationId": "c200"
  }
}
```

#### Server Actions

1. Verify agent is assigned to conversation, otherwise return an error with "not allowed" message.
2. Verify conversation status is **"assigned"**:
   - If status is "open" → return ERROR "Conversation not yet assigned".
   - If status is "closed" → return ERROR "Conversation already closed".
3. Save all in-memory messages to MongoDB (bulk insert).
4. Update conversation status to "closed" in database.
5. Broadcast closure to all sockets in room (excluding sender).
6. Remove all sockets from room.
7. Delete room from memory.
8. Delete in-memory messages for this conversation.

#### Broadcast Message (Excluding Sender)

JavaScript

Copy

```javascript
{
  "event": "CONVERSATION_CLOSED",
  "data": {
    "conversationId": "c200"
  }
}
```

------

## Section 9 — WebSocket Error Handling

### WebSocket Disconnect Behavior

- When a socket disconnects:
  1. Remove socket from all joined rooms.
  2. Delete room if empty.
  3. In-memory messages are NOT deleted (persist until conversation closes).
  4. Agents/Candidates can rejoin anytime using JOIN_CONVERSATION.

### Error Message Format (GLOBAL)

JavaScript

Copy

```javascript
{
  "event": "ERROR",
  "data": {
    "message": "Error description"
  }
}
```

### Common Errors

- **Invalid JWT**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "Unauthorized or invalid token"
    }
  }
  ```

  

- **Forbidden Role**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "Forbidden for this role"
    }
  }
  ```

  

- **Not Joined to Room**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "You must join the conversation first"
    }
  }
  ```

  

- **Conversation Closed**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "Conversation already closed"
    }
  }
  ```

  

- **Unauthorized Access**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "Not allowed to access this conversation"
    }
  }
  ```

  

- **Invalid Request**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "Invalid message format"
    }
  }
  ```

  

- **Unknown Event**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "Unknown event"
    }
  }
  ```

  

- **Invalid Request Schema**:

  JavaScript

  Copy

  ```javascript
  {
    "event": "ERROR",
    "data": {
      "message": "Invalid request schema"
    }
  }
  ```

  

------

## Section 10 — Final Acceptance Criteria

### What “Done” Means

- All core features are functional.
- Application is deployable and accessible.
- Demo script is prepared and practiced.

### Submission Checklist

- Deployed application link.
- Source code repository.
- Demo script and presentation slides.
- Documentation for setup and usage.

### Judging Alignment Checklist

- Meets hackathon theme and criteria.
- Demonstrates innovation and practicality.
- Provides a clear solution to the identified problem.