# 🎮 Tetris Battle — Real-time Multiplayer PvP

A full-stack, production-ready multiplayer Tetris battle game with real-time gameplay, lobby system, ranked matchmaking, and a dark futuristic UI.

---

## 🚀 Quick Start

### Development (Recommended)

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start both server and client
npm run dev
```

- **Client:** http://localhost:3000  
- **Server:** http://localhost:3001

### Docker (Production)

```bash
docker-compose up --build
```

---

## 🏗️ Project Structure

```
tetris-battle/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── TetrisBoard.jsx   # Canvas renderer
│   │   │   │   └── GameHUD.jsx       # Score, next piece, hold
│   │   │   └── ui/
│   │   │       └── ChatPanel.jsx     # Global + room chat
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx          # Nickname + avatar selection
│   │   │   ├── LobbyPage.jsx         # Room list + create/join
│   │   │   ├── RoomPage.jsx          # Pre-game lobby
│   │   │   ├── GamePage.jsx          # Live PvP game arena
│   │   │   ├── LeaderboardPage.jsx   # Global rankings
│   │   │   └── ProfilePage.jsx       # Stats, settings, achievements
│   │   ├── hooks/
│   │   │   ├── useSocket.js          # Socket.IO client events
│   │   │   ├── useKeyboard.js        # Input with DAS/ARR
│   │   │   └── useSound.js           # Web Audio API SFX
│   │   └── store/
│   │       └── gameStore.js          # Zustand global state
│   └── ...config files
│
├── server/                  # Node.js + Express + Socket.IO
│   └── src/
│       ├── services/
│       │   ├── GameEngine.js         # Core Tetris logic
│       │   └── RoomManager.js        # Room/matchmaking/game loop
│       └── index.js                  # Server entry + all socket events
│
└── shared/
    └── constants.js                  # Shared game constants
```

---

## ✨ Features

### Gameplay
- ✅ Classic Tetris mechanics (SRS rotation, wall kicks)
- ✅ 7-bag randomizer for fair piece distribution
- ✅ Ghost piece for drop preview
- ✅ Hold piece system
- ✅ Soft drop & hard drop
- ✅ Garbage lines sent to opponent on line clears
- ✅ Increasing speed per level
- ✅ DAS (Delayed Auto Shift) + ARR (Auto Repeat Rate) for smooth input

### Multiplayer
- ✅ Real-time gameplay via Socket.IO (60fps server loop)
- ✅ Garbage line mechanics (1→0, 2→1, 3→2, 4→4 lines)
- ✅ Spectator mode
- ✅ Room codes for private matches
- ✅ Auto-start when all players ready
- ✅ Quick matchmaking queue

### Lobby System
- ✅ Create public/private rooms
- ✅ Join by 6-character room code
- ✅ Real-time player list updates
- ✅ Ready/Not Ready status
- ✅ Countdown before game start

### Social
- ✅ Global chat (persisted in session)
- ✅ Room chat
- ✅ Online player count
- ✅ Rank system: Bronze → Silver → Gold → Diamond → Master
- ✅ ELO-based leaderboard
- ✅ Custom avatars (emoji)

### UI/UX
- ✅ Dark futuristic glassmorphism design
- ✅ Neon blue/purple accents
- ✅ Framer Motion animations
- ✅ Canvas-based game rendering
- ✅ Mobile touch controls
- ✅ Web Audio API sound effects
- ✅ Profile page with achievements
- ✅ Settings (volume, key bindings, ghost piece)

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| ← → | Move left/right |
| ↑ | Rotate clockwise |
| Z | Rotate counter-clockwise |
| ↓ | Soft drop |
| Space | Hard drop |
| C | Hold piece |
| Esc | Pause |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + Custom CSS |
| Animations | Framer Motion |
| State | Zustand |
| Real-time | Socket.IO |
| Backend | Node.js + Express |
| Auth | JWT |
| Rendering | HTML5 Canvas |
| Audio | Web Audio API |
| Deploy | Docker + Nginx |

---

## 🔧 Environment Variables

```env
# server/.env
PORT=3001
JWT_SECRET=your-secret-key-here
```

---

## 📦 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/guest | Create guest session |
| GET | /api/leaderboard | Get top 50 players |
| GET | /api/rooms | Get public rooms |
| GET | /health | Server health check |

---

## 🔌 Socket Events

### Client → Server
- `lobby:createRoom` — Create a new room
- `lobby:joinRoom` — Join by room ID
- `lobby:leaveRoom` — Leave current room
- `lobby:playerReady` — Toggle ready state
- `lobby:startGame` — Force start (host only)
- `game:action` — Send player input
- `game:pause` — Toggle pause
- `chat:global` — Send global message
- `chat:room` — Send room message
- `match:joinQueue` — Enter matchmaking
- `leaderboard:get` — Request leaderboard

### Server → Client
- `game:start` — Game is starting
- `game:state` — Full game state (60fps)
- `game:garbage` — Garbage lines received
- `game:over` — Player eliminated
- `game:win` — Match winner declared
- `chat:message` — Incoming chat message
- `lobby:roomUpdated` — Room state changed
- `players:online` — Online player count
- `match:found` — Matchmaking succeeded

---

## 🚀 Deployment

### Fly.io
```bash
fly launch
fly deploy
```

### Railway
```bash
railway up
```

### Render
Deploy as two services (server + client) using the Dockerfiles.

---

## 🎯 Anti-Cheat

- All game logic runs server-side (clients only send inputs)
- JWT authentication on every socket connection
- Rate limiting on REST endpoints
- Input validation on all socket events
- Server-authoritative game state

---

## 📈 Scaling

For production scale:
- Replace in-memory stores with **MongoDB** (user data, match history)
- Use **Redis** for room state and Socket.IO adapter across multiple nodes
- Add **Redis pub/sub** for horizontal scaling
- Use **MongoDB** TTL indexes for session cleanup

```bash
npm install @socket.io/redis-adapter ioredis mongoose
```
