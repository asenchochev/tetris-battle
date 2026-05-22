'use strict';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { EVENTS, RANKS } = require('../../shared/constants');
const RoomManager = require('./services/RoomManager');

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.JWT_SECRET || 'tetris-battle-secret-2024';

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.json());

// In-memory stores (replace with MongoDB in production)
const users = new Map();
const onlinePlayers = new Map();
const globalChat = [];
const leaderboard = [];

const roomManager = new RoomManager(io);

// REST endpoints
app.post('/api/auth/guest', (req, res) => {
  const { nickname } = req.body;
  if (!nickname || nickname.length < 2 || nickname.length > 20) {
    return res.status(400).json({ error: 'Nickname must be 2-20 characters' });
  }

  const userId = uuidv4();
  const user = {
    id: userId,
    nickname: nickname.trim(),
    elo: 1000,
    rank: 'Bronze',
    avatar: '🎮',
    wins: 0,
    losses: 0,
    totalGames: 0,
    totalLines: 0,
    bestScore: 0,
    achievements: [],
    createdAt: Date.now()
  };

  users.set(userId, user);
  const token = jwt.sign({ userId, nickname: user.nickname }, JWT_SECRET, { expiresIn: '24h' });

  res.json({ token, user });
});

app.get('/api/leaderboard', (req, res) => {
  const sorted = Array.from(users.values())
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 50)
    .map((u, i) => ({
      rank: i + 1,
      nickname: u.nickname,
      elo: u.elo,
      rankName: u.rank,
      wins: u.wins,
      losses: u.losses,
      bestScore: u.bestScore,
      avatar: u.avatar
    }));
  res.json(sorted);
});

app.get('/api/rooms', (req, res) => {
  res.json(roomManager.getPublicRooms());
});

app.get('/health', (req, res) => res.json({ status: 'ok', players: onlinePlayers.size }));

// Socket.IO middleware - auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);
    if (!user) return next(new Error('User not found'));

    socket.userId = decoded.userId;
    socket.nickname = user.nickname;
    socket.rank = user.rank;
    socket.avatar = user.avatar;
    socket.user = user;
    next();
  } catch (e) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`[+] ${socket.nickname} connected (${socket.id})`);

  // Track online
  onlinePlayers.set(socket.id, {
    id: socket.id,
    nickname: socket.nickname,
    rank: socket.rank,
    avatar: socket.avatar,
    status: 'online'
  });

  io.emit(EVENTS.PLAYERS_ONLINE, onlinePlayers.size);

  // Send recent global chat
  socket.emit(CHAT_GLOBAL_HISTORY, globalChat.slice(-50));

  // Room list
  socket.emit(EVENTS.LOBBY_ROOM_LIST, roomManager.getPublicRooms());

  // --- Lobby events ---
  socket.on(EVENTS.LOBBY_CREATE_ROOM, (data, cb) => {
    try {
      const room = roomManager.createRoom(socket, {
        ...data,
        hostNickname: socket.nickname
      });
      io.emit(EVENTS.LOBBY_ROOM_LIST, roomManager.getPublicRooms());
      cb?.({ room });
    } catch (e) {
      cb?.({ error: e.message });
    }
  });

  socket.on(EVENTS.LOBBY_JOIN_ROOM, (data, cb) => {
    const result = roomManager.joinRoom(socket, {
      ...data,
      nickname: socket.nickname
    });
    if (!result.error) {
      io.emit(EVENTS.LOBBY_ROOM_LIST, roomManager.getPublicRooms());
    }
    cb?.(result);
  });

  socket.on(EVENTS.LOBBY_LEAVE_ROOM, () => {
    roomManager.leaveRoom(socket);
    io.emit(EVENTS.LOBBY_ROOM_LIST, roomManager.getPublicRooms());
  });

  socket.on(EVENTS.LOBBY_PLAYER_READY, (ready) => {
    roomManager.setReady(socket, ready);
  });

  socket.on(EVENTS.LOBBY_START_GAME, () => {
    const roomId = roomManager.playerRooms.get(socket.id);
    if (roomId) {
      const room = roomManager.rooms.get(roomId);
      if (room && room.host === socket.id) {
        roomManager.startGame(roomId);
      }
    }
  });

  socket.on(EVENTS.LOBBY_SPECTATE, (data, cb) => {
    const result = roomManager.spectateRoom(socket, data.roomId, socket.nickname);
    cb?.(result);
  });

  // --- Game events ---
  socket.on(EVENTS.GAME_ACTION, (action) => {
    roomManager.handleAction(socket, action);
  });

  socket.on(EVENTS.GAME_PAUSE, () => {
    const roomId = roomManager.playerRooms.get(socket.id);
    if (roomId) {
      const room = roomManager.rooms.get(roomId);
      if (room?.engines) {
        const engine = room.engines.get(socket.id);
        engine?.pause();
      }
    }
  });

  // --- Chat events ---
  socket.on(EVENTS.CHAT_GLOBAL, (message) => {
    if (!message || message.length > 200) return;
    const msg = {
      id: uuidv4(),
      nickname: socket.nickname,
      avatar: socket.avatar,
      rank: socket.rank,
      message: message.trim(),
      timestamp: Date.now()
    };
    globalChat.push(msg);
    if (globalChat.length > 500) globalChat.shift();
    io.emit(EVENTS.CHAT_MESSAGE, { type: 'global', ...msg });
  });

  socket.on(EVENTS.CHAT_ROOM, (message) => {
    if (!message || message.length > 200) return;
    const roomId = roomManager.playerRooms.get(socket.id);
    if (!roomId) return;

    const msg = {
      id: uuidv4(),
      nickname: socket.nickname,
      avatar: socket.avatar,
      rank: socket.rank,
      message: message.trim(),
      timestamp: Date.now()
    };
    io.to(roomId).emit(EVENTS.CHAT_MESSAGE, { type: 'room', roomId, ...msg });
  });

  // --- Matchmaking ---
  socket.on(EVENTS.MATCH_JOIN_QUEUE, () => {
    roomManager.addToMatchmaking(socket, socket.nickname);
  });

  socket.on(EVENTS.MATCH_LEAVE_QUEUE, () => {
    roomManager.removeFromMatchmaking(socket.id);
  });

  // --- Leaderboard ---
  socket.on(EVENTS.LEADERBOARD_GET, (cb) => {
    const sorted = Array.from(users.values())
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 50)
      .map((u, i) => ({
        rank: i + 1,
        nickname: u.nickname,
        elo: u.elo,
        rankName: u.rank,
        wins: u.wins,
        losses: u.losses,
        bestScore: u.bestScore,
        avatar: u.avatar
      }));
    cb?.(sorted);
    socket.emit(EVENTS.LEADERBOARD_DATA, sorted);
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.nickname} disconnected`);
    onlinePlayers.delete(socket.id);
    roomManager.leaveRoom(socket);
    roomManager.removeFromMatchmaking(socket.id);
    io.emit(EVENTS.PLAYERS_ONLINE, onlinePlayers.size);
    io.emit(EVENTS.LOBBY_ROOM_LIST, roomManager.getPublicRooms());
  });
});

const CHAT_GLOBAL_HISTORY = 'chat:history';

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Tetris Battle Server running on port ${PORT}`);
});

module.exports = { app, server };
