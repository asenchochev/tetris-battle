import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import toast from 'react-hot-toast';

const RANK_ICONS = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Diamond: '💎', Master: '👑' };
const RANK_COLORS = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Diamond: '#b9f2ff', Master: '#ff00ff' };

function PlayerSlot({ player, isHost, isMe, socket }) {
  const rankColor = RANK_COLORS[player.rank] || '#cd7f32';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="glass rounded-xl p-5 border flex items-center gap-4"
      style={{
        borderColor: isMe ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.08)',
        boxShadow: isMe ? '0 0 20px rgba(0,245,255,0.08)' : 'none'
      }}
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl glass"
          style={{ border: `2px solid ${rankColor}44` }}>
          {player.avatar || '🎮'}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{ background: player.ready ? '#00ff88' : '#333', border: '2px solid #050510' }}>
          {player.ready ? '✓' : '·'}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-base" style={{ color: isMe ? '#00f5ff' : '#e0e0ff' }}>
            {player.nickname}
          </span>
          {isHost && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#ffd70022', color: '#ffd700', border: '1px solid #ffd70033' }}>
              HOST
            </span>
          )}
          {isMe && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#00f5ff22', color: '#00f5ff', border: '1px solid #00f5ff33' }}>
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span style={{ color: rankColor }}>{RANK_ICONS[player.rank] || '🥉'}</span>
          <span className="text-xs font-mono" style={{ color: rankColor }}>{player.rank || 'Bronze'}</span>
        </div>
      </div>

      <div className="text-right">
        <div className={`font-display text-sm font-bold ${player.ready ? 'text-green-400' : 'text-gray-600'}`}
          style={player.ready ? { textShadow: '0 0 10px #00ff88' } : {}}>
          {player.ready ? '✅ READY' : '⏳ NOT READY'}
        </div>
      </div>
    </motion.div>
  );
}

function EmptySlot({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
      className="glass rounded-xl p-5 border border-dashed flex items-center gap-4"
      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
    >
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-700 text-2xl">
        ?
      </div>
      <div>
        <div className="font-display text-sm text-gray-700">Waiting for player...</div>
        <div className="text-xs text-gray-800 font-mono mt-1">Slot {index + 1}</div>
      </div>
    </motion.div>
  );
}

export default function RoomPage() {
  const { currentRoom, socket, user, setCurrentRoom, setActiveTab, gameStatus } = useGameStore();
  const [isReady, setIsReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const isHost = currentRoom?.host === socket?.id;
  const myPlayer = currentRoom?.players?.find(p => p.id === socket?.id);
  const allReady = currentRoom?.players?.length >= 2 && currentRoom?.players?.every(p => p.ready);

  // Countdown when all ready
  useEffect(() => {
    if (allReady && countdown === null) {
      setCountdown(3);
    } else if (!allReady) {
      setCountdown(null);
    }
  }, [allReady]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // If game started, switch to game view
  useEffect(() => {
    if (gameStatus === 'playing') {
      setActiveTab('game');
    }
  }, [gameStatus]);

  const handleReady = () => {
    const newReady = !isReady;
    setIsReady(newReady);
    socket?.emit('lobby:playerReady', newReady);
  };

  const handleStart = () => {
    if (!isHost) return;
    socket?.emit('lobby:startGame');
  };

  const handleLeave = () => {
    socket?.emit('lobby:leaveRoom');
    setCurrentRoom(null);
    setActiveTab('lobby');
    setIsReady(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentRoom?.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Room code copied!');
  };

  if (!currentRoom) return null;

  const slots = Array.from({ length: currentRoom.maxPlayers });

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="font-display text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 15px #00f5ff' }}>
            {currentRoom.name}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono transition-all hover:bg-blue-500 hover:bg-opacity-10"
              style={{ borderColor: 'rgba(0,245,255,0.3)', color: '#00f5ff' }}
              onClick={copyCode}
            >
              <span>#{currentRoom.id}</span>
              <span>{copied ? '✓' : '📋'}</span>
            </button>
            <span className="text-xs text-gray-600 font-mono">
              {currentRoom.isPrivate ? '🔒 Private' : '🌐 Public'}
            </span>
            {currentRoom.spectators?.length > 0 && (
              <span className="text-xs text-orange-400 font-mono">
                👁 {currentRoom.spectators.length} watching
              </span>
            )}
          </div>
        </div>

        <button
          className="text-xs text-gray-600 hover:text-red-400 font-mono transition-colors"
          onClick={handleLeave}
        >← Leave Room</button>
      </div>

      {/* Players grid */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <AnimatePresence>
          {slots.map((_, i) => {
            const player = currentRoom.players[i];
            return player ? (
              <PlayerSlot
                key={player.id}
                player={player}
                isHost={player.id === currentRoom.host}
                isMe={player.id === socket?.id}
                socket={socket}
              />
            ) : (
              <EmptySlot key={`empty-${i}`} index={i} />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="font-display text-9xl font-black"
              style={{ color: '#00f5ff', textShadow: '0 0 60px #00f5ff, 0 0 120px #00f5ff' }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex-shrink-0">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-mono text-gray-600">
            {currentRoom.players.filter(p => p.ready).length}/{currentRoom.players.length} ready
          </div>
          <div className="flex gap-1">
            {currentRoom.players.map(p => (
              <div key={p.id} className="w-2 h-2 rounded-full" style={{ background: p.ready ? '#00ff88' : '#333' }} />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {/* Ready button (non-host or host who wants to play) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 rounded-lg font-display text-sm uppercase tracking-wider border-2 transition-all"
            style={{
              borderColor: isReady ? '#00ff88' : 'rgba(0,245,255,0.4)',
              color: isReady ? '#00ff88' : '#00f5ff',
              background: isReady ? 'rgba(0,255,136,0.08)' : 'rgba(0,245,255,0.05)',
              boxShadow: isReady ? '0 0 20px rgba(0,255,136,0.2)' : 'none'
            }}
            onClick={handleReady}
          >
            {isReady ? '✅ Ready!' : '⏳ Ready Up'}
          </motion.button>

          {/* Start button (host only, all ready) */}
          {isHost && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-lg font-display text-sm uppercase tracking-wider border-2 transition-all"
              style={{
                borderColor: allReady ? '#ffd700' : 'rgba(255,215,0,0.2)',
                color: allReady ? '#ffd700' : '#666',
                background: allReady ? 'rgba(255,215,0,0.08)' : 'transparent',
                boxShadow: allReady ? '0 0 20px rgba(255,215,0,0.2)' : 'none',
                cursor: allReady ? 'pointer' : 'not-allowed'
              }}
              onClick={handleStart}
              disabled={!allReady}
            >
              {allReady ? '🚀 Force Start' : '⏳ Waiting...'}
            </motion.button>
          )}
        </div>

        {currentRoom.players.length < 2 && (
          <p className="text-center text-xs text-gray-700 font-mono mt-2">
            Share room code <span style={{ color: '#00f5ff' }}>#{currentRoom.id}</span> with a friend
          </p>
        )}
      </div>
    </div>
  );
}
