import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import toast from 'react-hot-toast';

const EVENTS = {
  PLAYERS_ONLINE: 'players:online',
  LOBBY_ROOM_UPDATED: 'lobby:roomUpdated',
  LOBBY_ROOM_LIST: 'lobby:roomList',
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_OVER: 'game:over',
  GAME_WIN: 'game:win',
  GAME_GARBAGE: 'game:garbage',
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history',
  LEADERBOARD_DATA: 'leaderboard:data',
  MATCH_FOUND: 'match:found',
  MATCH_SEARCHING: 'match:searching',
  ERROR: 'error',
};

export function useSocket() {
  const socketRef = useRef(null);
  const store = useGameStore();

  useEffect(() => {
    const token = store.token;
    if (!token) return;

    const socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    store.setSocket(socket);

    socket.on('connect', () => {
      store.setConnected(true);
      socket.emit('leaderboard:get');
    });

    socket.on('disconnect', () => {
      store.setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
      toast.error('Connection error. Retrying...');
    });

    // Online players
    socket.on(EVENTS.PLAYERS_ONLINE, (count) => {
      store.setOnlinePlayers(count);
    });

    // Room events
    socket.on(EVENTS.LOBBY_ROOM_LIST, (rooms) => {
      store.setRooms(rooms);
    });

    socket.on(EVENTS.LOBBY_ROOM_UPDATED, (room) => {
      store.setCurrentRoom(room);
    });

    // Game events
    socket.on(EVENTS.GAME_START, (data) => {
      store.setGameStatus('playing');
      store.setPlayers(data.players);
      store.clearRoomMessages();
      toast.success('🎮 Game Started!', { duration: 2000 });
    });

    socket.on(EVENTS.GAME_STATE, ({ states, players }) => {
      const myId = store.socket?.id;
      const myState = states[myId];
      const opponentStates = Object.fromEntries(
        Object.entries(states).filter(([id]) => id !== myId)
      );
      if (myState) store.setGameState(myState);
      store.setOpponentStates(opponentStates);
      store.setPlayers(players);
    });

    socket.on(EVENTS.GAME_OVER, ({ playerId }) => {
      if (playerId === socket.id) {
        store.setGameStatus('over');
        toast.error('💀 You lost!', { duration: 3000 });
      }
    });

    socket.on(EVENTS.GAME_WIN, (data) => {
      store.setWinner(data.winnerId);
      store.setGameStatus(data.winnerId === socket.id ? 'won' : 'over');
      if (data.winnerId === socket.id) {
        toast.success('🏆 You Win!', { duration: 5000 });
      }
    });

    socket.on(EVENTS.GAME_GARBAGE, ({ lines }) => {
      store.setLastGarbage({ lines, time: Date.now() });
      toast.error(`⚠️ +${lines} garbage lines!`, {
        duration: 1500,
        style: { background: '#1a0010', border: '1px solid #ff3366', color: '#ff3366' }
      });
    });

    // Chat
    socket.on('chat:history', (messages) => {
      store.setGlobalMessages(messages);
    });

    socket.on(EVENTS.CHAT_MESSAGE, (msg) => {
      if (msg.type === 'global') {
        store.addGlobalMessage(msg);
      } else if (msg.type === 'room') {
        store.addRoomMessage(msg);
      }
    });

    // Leaderboard
    socket.on(EVENTS.LEADERBOARD_DATA, (data) => {
      store.setLeaderboard(data);
    });

    // Matchmaking
    socket.on(EVENTS.MATCH_FOUND, ({ roomId }) => {
      store.setInQueue(false);
      socket.emit('lobby:joinRoom', { roomId }, (result) => {
        if (result?.room) {
          store.setCurrentRoom(result.room);
          store.setActiveTab('room');
          toast.success('⚡ Match Found!');
        }
      });
    });

    socket.on('match:searching', ({ position }) => {
      toast(`🔍 In queue... Position: ${position}`, { duration: 2000 });
    });

    // Errors
    socket.on(EVENTS.ERROR, (msg) => {
      toast.error(msg);
    });

    return () => {
      socket.disconnect();
      store.setSocket(null);
      store.setConnected(false);
    };
  }, [store.token]);

  return socketRef.current;
}
