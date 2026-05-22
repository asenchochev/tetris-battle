'use strict';

const { v4: uuidv4 } = require('uuid');
const GameEngine = require('./GameEngine');
const { EVENTS, GARBAGE_TABLE } = require('../../../shared/constants');

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.playerRooms = new Map(); // socketId -> roomId
    this.matchmakingQueue = [];
    this.gameLoops = new Map();
  }

  createRoom(socket, { name, isPrivate, maxPlayers, hostNickname }) {
    const roomId = this.generateRoomCode();
    const room = {
      id: roomId,
      name: name || `${hostNickname}'s Room`,
      isPrivate: isPrivate || false,
      maxPlayers: maxPlayers || 2,
      host: socket.id,
      players: [{
        id: socket.id,
        nickname: hostNickname || socket.nickname,
        ready: false,
        score: 0,
        level: 1,
        lines: 0,
        alive: true,
        rank: socket.rank || 'Bronze',
        avatar: socket.avatar || '🎮'
      }],
      spectators: [],
      status: 'waiting', // waiting | playing | finished
      chat: [],
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    return room;
  }

  joinRoom(socket, { roomId, nickname }) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.status === 'playing') {
      return this.spectateRoom(socket, roomId, nickname);
    }
    if (room.players.length >= room.maxPlayers) return { error: 'Room is full' };
    if (room.players.find(p => p.id === socket.id)) return { error: 'Already in room' };

    room.players.push({
      id: socket.id,
      nickname: nickname || socket.nickname,
      ready: false,
      score: 0,
      level: 1,
      lines: 0,
      alive: true,
      rank: socket.rank || 'Bronze',
      avatar: socket.avatar || '🎮'
    });

    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    this.io.to(roomId).emit(EVENTS.LOBBY_ROOM_UPDATED, room);
    return { room };
  }

  spectateRoom(socket, roomId, nickname) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    room.spectators.push({ id: socket.id, nickname: nickname || 'Spectator' });
    socket.join(roomId);
    socket.isSpectator = true;

    return { room, spectating: true };
  }

  leaveRoom(socket) {
    const roomId = this.playerRooms.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    room.spectators = room.spectators.filter(s => s.id !== socket.id);
    this.playerRooms.delete(socket.id);
    socket.leave(roomId);

    if (room.players.length === 0) {
      this.destroyRoom(roomId);
      return;
    }

    // Transfer host
    if (room.host === socket.id && room.players.length > 0) {
      room.host = room.players[0].id;
    }

    this.io.to(roomId).emit(EVENTS.LOBBY_ROOM_UPDATED, room);
  }

  setReady(socket, ready) {
    const roomId = this.playerRooms.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = ready;
      this.io.to(roomId).emit(EVENTS.LOBBY_ROOM_UPDATED, room);
    }

    // Auto-start if all ready
    if (room.players.length >= 2 && room.players.every(p => p.ready)) {
      setTimeout(() => this.startGame(roomId), 1000);
    }
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status === 'playing') return;

    room.status = 'playing';
    room.engines = new Map();

    for (const player of room.players) {
      player.alive = true;
      player.score = 0;
      player.level = 1;
      player.lines = 0;
      room.engines.set(player.id, new GameEngine(player.id));
    }

    this.io.to(roomId).emit(EVENTS.GAME_START, {
      roomId,
      players: room.players
    });

    this.startGameLoop(roomId);
  }

  startGameLoop(roomId) {
    const interval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        clearInterval(interval);
        this.gameLoops.delete(roomId);
        return;
      }

      const now = Date.now();
      let garbageSenders = [];

      for (const player of room.players) {
        if (!player.alive) continue;
        const engine = room.engines.get(player.id);
        if (!engine) continue;

        const garbage = engine.tick(now);

        if (engine.gameOver) {
          player.alive = false;
          this.io.to(roomId).emit(EVENTS.GAME_OVER, { playerId: player.id });

          const alivePlayers = room.players.filter(p => p.alive);
          if (alivePlayers.length <= 1) {
            this.endGame(roomId, alivePlayers[0]?.id);
            clearInterval(interval);
            return;
          }
        }

        if (garbage !== null && garbage > 0) {
          garbageSenders.push({ from: player.id, lines: garbage });
        }

        player.score = engine.score;
        player.level = engine.level;
        player.lines = engine.lines;
      }

      // Send garbage to opponents
      for (const { from, lines } of garbageSenders) {
        for (const player of room.players) {
          if (player.id !== from && player.alive) {
            const engine = room.engines.get(player.id);
            if (engine) {
              engine.addGarbage(lines);
              this.io.to(player.id).emit(EVENTS.GAME_GARBAGE, { lines, from });
            }
          }
        }
      }

      // Broadcast game states
      const states = {};
      for (const player of room.players) {
        const engine = room.engines.get(player.id);
        if (engine) {
          states[player.id] = engine.getState();
        }
      }

      this.io.to(roomId).emit(EVENTS.GAME_STATE, {
        states,
        players: room.players.map(p => ({
          id: p.id,
          nickname: p.nickname,
          score: p.score,
          level: p.level,
          lines: p.lines,
          alive: p.alive,
          rank: p.rank,
          avatar: p.avatar
        }))
      });

    }, 1000 / 60); // 60fps

    this.gameLoops.set(roomId, interval);
  }

  handleAction(socket, action) {
    const roomId = this.playerRooms.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    const engine = room.engines?.get(socket.id);
    if (!engine) return;

    const { ACTIONS } = require('../../../shared/constants');
    
    switch (action) {
      case ACTIONS.MOVE_LEFT: engine.moveLeft(); break;
      case ACTIONS.MOVE_RIGHT: engine.moveRight(); break;
      case ACTIONS.ROTATE: engine.rotate(1); break;
      case ACTIONS.ROTATE_CCW: engine.rotate(-1); break;
      case ACTIONS.SOFT_DROP: engine.softDrop(); break;
      case ACTIONS.HARD_DROP: engine.hardDrop(); break;
      case ACTIONS.HOLD: engine.hold(); break;
    }
  }

  endGame(roomId, winnerId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = 'finished';

    this.io.to(roomId).emit(EVENTS.GAME_WIN, {
      winnerId,
      scores: room.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        lines: p.lines
      }))
    });

    // Reset room after delay
    setTimeout(() => {
      if (room) {
        room.status = 'waiting';
        room.engines = null;
        for (const p of room.players) {
          p.ready = false;
          p.score = 0;
          p.level = 1;
          p.lines = 0;
          p.alive = true;
        }
        this.io.to(roomId).emit(EVENTS.LOBBY_ROOM_UPDATED, room);
      }
    }, 10000);
  }

  destroyRoom(roomId) {
    const loop = this.gameLoops.get(roomId);
    if (loop) {
      clearInterval(loop);
      this.gameLoops.delete(roomId);
    }
    this.rooms.delete(roomId);
  }

  getPublicRooms() {
    return Array.from(this.rooms.values())
      .filter(r => !r.isPrivate)
      .map(r => ({
        id: r.id,
        name: r.name,
        players: r.players.length,
        maxPlayers: r.maxPlayers,
        status: r.status,
        spectators: r.spectators.length
      }));
  }

  generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  addToMatchmaking(socket, nickname) {
    if (this.matchmakingQueue.find(p => p.id === socket.id)) return;
    this.matchmakingQueue.push({ id: socket.id, nickname, socket });

    if (this.matchmakingQueue.length >= 2) {
      const p1 = this.matchmakingQueue.shift();
      const p2 = this.matchmakingQueue.shift();

      const room = this.createRoom(p1.socket, { hostNickname: p1.nickname });
      this.joinRoom(p2.socket, { roomId: room.id, nickname: p2.nickname });

      p1.socket.emit(EVENTS.MATCH_FOUND, { roomId: room.id });
      p2.socket.emit(EVENTS.MATCH_FOUND, { roomId: room.id });
    } else {
      socket.emit('match:searching', { position: this.matchmakingQueue.length });
    }
  }

  removeFromMatchmaking(socketId) {
    this.matchmakingQueue = this.matchmakingQueue.filter(p => p.id !== socketId);
  }
}

module.exports = RoomManager;
