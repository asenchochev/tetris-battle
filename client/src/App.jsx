import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import ChatPanel from './components/ui/ChatPanel';

const NAV_ITEMS = [
  { id: 'lobby', label: 'Lobby', icon: '🎮' },
  { id: 'leaderboard', label: 'Ranks', icon: '🏆' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

function NavBar() {
  const { activeTab, setActiveTab, user, connected, onlinePlayers, currentRoom, gameStatus } = useGameStore();

  const canNavigate = gameStatus !== 'playing';

  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b"
      style={{ borderColor: 'rgba(0,245,255,0.1)', background: 'rgba(2,2,15,0.9)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ textShadow: ['0 0 10px #00f5ff', '0 0 20px #bf00ff', '0 0 10px #00f5ff'] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="font-display text-lg font-black"
          style={{ color: '#00f5ff' }}
        >
          TETRIS<span style={{ color: '#bf00ff' }}>BATTLE</span>
        </motion.div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-mono text-gray-600">{onlinePlayers} online</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-1">
        {currentRoom && gameStatus === 'playing' ? (
          <button
            className="px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border border-green-500 border-opacity-40 text-green-400 bg-green-500 bg-opacity-10"
            onClick={() => setActiveTab('game')}
          >⚔️ In Game</button>
        ) : currentRoom ? (
          <button
            className="px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border border-yellow-500 border-opacity-40 text-yellow-400 bg-yellow-500 bg-opacity-10"
            onClick={() => setActiveTab('room')}
          >🚪 In Room</button>
        ) : null}

        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            disabled={!canNavigate && item.id !== 'game'}
            className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider transition-all ${activeTab === item.id ? 'bg-blue-500 bg-opacity-15 text-blue-400 border border-blue-500 border-opacity-30' : 'text-gray-600 hover:text-gray-400 disabled:opacity-30'}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="mr-1">{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:block text-right">
          <div className="text-xs font-mono" style={{ color: 'rgba(0,245,255,0.25)' }}>by</div>
          <div className="text-xs font-mono font-bold" style={{ color: 'rgba(0,245,255,0.45)' }}>Asen Chochev</div>
        </div>
        <span className="text-base">{user?.avatar || '🎮'}</span>
        <div className="hidden sm:block">
          <div className="font-display text-xs text-blue-300">{user?.nickname}</div>
          <div className="text-xs font-mono text-gray-600">{user?.rank || 'Bronze'}</div>
        </div>
      </div>
    </div>
  );
}

function MainContent() {
  const { activeTab, gameStatus } = useGameStore();

  const pages = {
    lobby: LobbyPage,
    room: RoomPage,
    game: GamePage,
    leaderboard: LeaderboardPage,
    profile: ProfilePage,
  };

  const Page = pages[activeTab] || LobbyPage;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="flex-1 overflow-hidden"
      >
        <Page />
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const { showChat, activeTab } = useGameStore();
  const hideChat = activeTab === 'game';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <NavBar />
        <MainContent />
      </div>

      {/* Chat sidebar */}
      {!hideChat && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: showChat ? 260 : 0, opacity: showChat ? 1 : 0 }}
          className="flex-shrink-0 border-l overflow-hidden"
          style={{ borderColor: 'rgba(0,245,255,0.08)', background: 'rgba(2,2,15,0.8)' }}
        >
          <div className="w-[260px] h-full">
            <ChatPanel />
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  const { user, token } = useGameStore();
  useSocket();

  if (!user || !token) {
    return (
      <>
        <AuthPage />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0d0d25', color: '#e0e0ff', border: '1px solid rgba(0,245,255,0.2)', fontFamily: 'Rajdhani, sans-serif' },
          }}
        />
      </>
    );
  }

  return (
    <>
      <AppShell />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0d0d25', color: '#e0e0ff', border: '1px solid rgba(0,245,255,0.2)', fontFamily: 'Rajdhani, sans-serif' },
        }}
      />
    </>
  );
}
