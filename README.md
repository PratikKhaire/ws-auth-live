# Live Support Chat System Backend

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?logo=mongodb)
![WebSocket](https://img.shields.io/badge/WebSocket-ws-blue)
![License](https://img.shields.io/badge/License-ISC-yellow)

A robust backend system for a real-time customer support platform with JWT authentication, role-based access control, and WebSocket-based messaging.

## Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Admin, Supervisor, Agent, and Candidate roles
- **Real-Time Messaging** - WebSocket-based communication
- **Conversation Management** - Create, assign, and close conversations
- **Admin Analytics** - System-level analytics for monitoring

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **WebSocket**: ws library
- **Authentication**: JWT + bcrypt

## Project Structure

```
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   ├── utils/            # Utility functions
│   ├── websocket/        # WebSocket server and handlers
│   └── app.js            # Express app setup
├── server.js             # Entry point
├── package.json
└── .env.example
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Configure your environment variables in `.env`

## Environment Variables

| Variable         | Description               | Default                            |
| ---------------- | ------------------------- | ---------------------------------- |
| `PORT`           | Server port               | 3000                               |
| `MONGODB_URI`    | MongoDB connection string | mongodb://localhost:27017/livechat |
| `JWT_SECRET`     | Secret key for JWT        | -                                  |
| `JWT_EXPIRES_IN` | JWT expiration time       | 24h                                |
| `CORS_ORIGIN`    | Allowed CORS origin       | \*                                 |

## Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### Authentication

| Method | Route          | Description             | Auth |
| ------ | -------------- | ----------------------- | ---- |
| POST   | `/auth/signup` | Register a new user     | No   |
| POST   | `/auth/login`  | Login and get JWT token | No   |
| GET    | `/auth/me`     | Get current user info   | Yes  |

### Conversations

| Method | Route                       | Description                  | Roles             |
| ------ | --------------------------- | ---------------------------- | ----------------- |
| POST   | `/conversations`            | Create a conversation        | Candidate         |
| POST   | `/conversations/:id/assign` | Assign agent to conversation | Supervisor        |
| GET    | `/conversations/:id`        | Get conversation details     | All\*             |
| POST   | `/conversations/:id/close`  | Close a conversation (HTTP)  | Admin, Supervisor |

### Admin

| Method | Route              | Description          | Roles |
| ------ | ------------------ | -------------------- | ----- |
| GET    | `/admin/analytics` | Get system analytics | Admin |

## WebSocket Events

Connect to WebSocket at: `ws://localhost:3000/ws?token=<JWT_TOKEN>`

### Client → Server Events

| Event                | Description                    | Roles            |
| -------------------- | ------------------------------ | ---------------- |
| `JOIN_CONVERSATION`  | Join a conversation room       | Candidate, Agent |
| `SEND_MESSAGE`       | Send a message                 | Candidate, Agent |
| `LEAVE_CONVERSATION` | Leave a conversation room      | Candidate, Agent |
| `CLOSE_CONVERSATION` | Close and persist conversation | Agent            |

### Server → Client Events

| Event                 | Description             |
| --------------------- | ----------------------- |
| `JOINED_CONVERSATION` | Confirmation of joining |
| `NEW_MESSAGE`         | New message received    |
| `LEFT_CONVERSATION`   | Confirmation of leaving |
| `CONVERSATION_CLOSED` | Conversation was closed |
| `ERROR`               | Error notification      |

### Message Format

All WebSocket messages follow this format:

```json
{
  "event": "EVENT_NAME",
  "data": {}
}
```

## User Roles

| Role           | Description                                   |
| -------------- | --------------------------------------------- |
| **Admin**      | Can view analytics and close any conversation |
| **Supervisor** | Manages agents and assigns conversations      |
| **Agent**      | Handles conversations assigned by supervisors |
| **Candidate**  | End user requesting support                   |

## Testing the API

### 1. Create Users

```bash
# Create Admin
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin User", "email": "admin@test.com", "password": "secret123", "role": "admin"}'

# Create Supervisor
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Supervisor User", "email": "supervisor@test.com", "password": "secret123", "role": "supervisor"}'

# Create Agent (requires supervisorId)
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Agent User", "email": "agent@test.com", "password": "secret123", "role": "agent", "supervisorId": "<SUPERVISOR_ID>"}'

# Create Candidate
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Candidate User", "email": "candidate@test.com", "password": "secret123", "role": "candidate"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "candidate@test.com", "password": "secret123"}'
```

### 3. Create Conversation

```bash
curl -X POST http://localhost:3000/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CANDIDATE_TOKEN>" \
  -d '{"supervisorId": "<SUPERVISOR_ID>"}'
```

### 4. WebSocket Testing (using wscat)

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:3000/ws?token=<JWT_TOKEN>"

# Send JOIN_CONVERSATION
{"event": "JOIN_CONVERSATION", "data": {"conversationId": "<CONVERSATION_ID>"}}

# Send SEND_MESSAGE
{"event": "SEND_MESSAGE", "data": {"conversationId": "<CONVERSATION_ID>", "content": "Hello!"}}
```

## Security

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication for API and WebSocket
- **Role-Based Access Control**: Fine-grained permissions based on user roles
- **Input Validation**: Request validation to prevent injection attacks
- **CORS Configuration**: Configurable cross-origin resource sharing

## License

ISC
