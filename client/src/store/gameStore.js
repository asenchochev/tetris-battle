import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useGameStore = create(
  subscribeWithSelector((set, get) => ({
    // Auth
    user: null,
    token: null,
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
    logout: () => set({ user: null, token: null, currentRoom: null }),

    // Socket
    socket: null,
    connected: false,
    onlinePlayers: 0,
    setSocket: (socket) => set({ socket }),
    setConnected: (connected) => set({ connected }),
    setOnlinePlayers: (count) => set({ onlinePlayers: count }),

    // Lobby
    rooms: [],
    currentRoom: null,
    setRooms: (rooms) => set({ rooms }),
    setCurrentRoom: (room) => set({ currentRoom: room }),

    // Game
    gameState: null,
    opponentStates: {},
    players: [],
    gameStatus: 'idle', // idle | playing | paused | over | won
    winner: null,
    setGameState: (gameState) => set({ gameState }),
    setOpponentStates: (states) => set({ opponentStates: states }),
    setPlayers: (players) => set({ players }),
    setGameStatus: (status) => set({ gameStatus: status }),
    setWinner: (winner) => set({ winner }),

    // Chat
    globalMessages: [],
    roomMessages: [],
    addGlobalMessage: (msg) => set((s) => ({
      globalMessages: [...s.globalMessages.slice(-99), msg]
    })),
    addRoomMessage: (msg) => set((s) => ({
      roomMessages: [...s.roomMessages.slice(-99), msg]
    })),
    setGlobalMessages: (msgs) => set({ globalMessages: msgs }),
    clearRoomMessages: () => set({ roomMessages: [] }),

    // Leaderboard
    leaderboard: [],
    setLeaderboard: (lb) => set({ leaderboard: lb }),

    // UI
    activeTab: 'lobby', // lobby | game | leaderboard | profile | settings
    setActiveTab: (tab) => set({ activeTab: tab }),
    showChat: true,
    toggleChat: () => set((s) => ({ showChat: !s.showChat })),

    // Matchmaking
    inQueue: false,
    setInQueue: (v) => set({ inQueue: v }),

    // Garbage notification
    lastGarbage: null,
    setLastGarbage: (g) => set({ lastGarbage: g }),

    // Settings
    settings: {
      sfxVolume: 0.7,
      musicVolume: 0.4,
      ghostPiece: true,
      showGrid: true,
      keyBindings: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        rotate: 'ArrowUp',
        rotateCCW: 'z',
        softDrop: 'ArrowDown',
        hardDrop: ' ',
        hold: 'c',
        pause: 'Escape'
      }
    },
    updateSettings: (settings) => set((s) => ({
      settings: { ...s.settings, ...settings }
    })),
  }))
);
