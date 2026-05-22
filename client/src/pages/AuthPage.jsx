import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import toast from 'react-hot-toast';

const AVATARS = ['🎮','👾','🤖','👻','🦊','🐉','🦁','🐺','🦅','🎯','⚡','🔥','💀','🌟','🚀','🎲'];

const TETROMINO_COLORS = ['#00f5ff','#ffd700','#bf00ff','#00ff88','#ff3366','#0055ff','#ff8800'];

function FloatingBlock({ color, x, y, delay, size = 30 }) {
  return (
    <motion.div
      className="absolute rounded-sm opacity-20"
      style={{
        width: size, height: size, left: `${x}%`, top: `${y}%`,
        background: color,
        boxShadow: `0 0 10px ${color}`,
      }}
      animate={{ y: [-20, 20, -20], rotate: [0, 180, 360], opacity: [0.1, 0.3, 0.1] }}
      transition={{ duration: 4 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default function AuthPage() {
  const { setUser, setToken } = useGameStore();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎮');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('nickname'); // nickname | avatar

  const blocks = TETROMINO_COLORS.flatMap((color, i) =>
    Array.from({ length: 4 }, (_, j) => ({
      color, delay: i * 0.5 + j * 0.3,
      x: Math.random() * 90, y: Math.random() * 90,
      size: 20 + Math.random() * 20
    }))
  );

  const handleSubmit = async () => {
    if (nickname.trim().length < 2) {
      toast.error('Nickname must be at least 2 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      data.user.avatar = selectedAvatar;
      setToken(data.token);
      setUser(data.user);
      toast.success(`Welcome, ${data.user.nickname}! 🎮`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Animated background blocks */}
      <div className="absolute inset-0 grid-bg" />
      {blocks.map((b, i) => <FloatingBlock key={i} {...b} />)}

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 opacity-5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass rounded-2xl p-8 border"
          style={{ borderColor: 'rgba(0,245,255,0.2)', boxShadow: '0 0 60px rgba(0,245,255,0.08), 0 0 120px rgba(191,0,255,0.05)' }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ textShadow: ['0 0 20px #00f5ff', '0 0 40px #bf00ff', '0 0 20px #00f5ff'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="font-display text-4xl font-black mb-2"
              style={{ color: '#00f5ff' }}
            >
              TETRIS
            </motion.div>
            <div className="font-display text-xl font-bold text-purple-400" style={{ textShadow: '0 0 15px #bf00ff' }}>
              BATTLE
            </div>
            <div className="text-xs text-gray-600 font-mono mt-2 tracking-widest uppercase">
              Multiplayer PvP · Real-time
            </div>
          </div>

          {step === 'nickname' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-6">
                <label className="block text-xs text-gray-500 font-mono uppercase tracking-widest mb-2">
                  Enter Nickname
                </label>
                <input
                  className="w-full bg-dark-900 border border-blue-500 border-opacity-30 rounded-lg px-4 py-3 text-white font-display text-lg tracking-wider focus:outline-none focus:border-blue-400 focus:border-opacity-70 transition-all placeholder-gray-800"
                  placeholder="Player_001"
                  value={nickname}
                  onChange={e => setNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                  onKeyDown={e => e.key === 'Enter' && nickname.length >= 2 && setStep('avatar')}
                  autoFocus
                  maxLength={20}
                />
                <div className="text-right text-xs text-gray-700 font-mono mt-1">{nickname.length}/20</div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-lg font-display text-base uppercase tracking-widest border-2 transition-all"
                style={{
                  borderColor: nickname.length >= 2 ? '#00f5ff' : 'rgba(0,245,255,0.2)',
                  color: nickname.length >= 2 ? '#00f5ff' : '#333',
                  background: nickname.length >= 2 ? 'rgba(0,245,255,0.05)' : 'transparent',
                  boxShadow: nickname.length >= 2 ? '0 0 20px rgba(0,245,255,0.15)' : 'none',
                }}
                disabled={nickname.length < 2}
                onClick={() => setStep('avatar')}
              >
                Continue →
              </motion.button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-6">
                <label className="block text-xs text-gray-500 font-mono uppercase tracking-widest mb-3">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATARS.map(av => (
                    <motion.button
                      key={av}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${selectedAvatar === av ? 'ring-2 ring-blue-400 bg-blue-500 bg-opacity-20 scale-110' : 'glass hover:bg-white hover:bg-opacity-5'}`}
                      onClick={() => setSelectedAvatar(av)}
                    >{av}</motion.button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 glass rounded-lg p-3 border border-white border-opacity-5">
                <span className="text-3xl">{selectedAvatar}</span>
                <div>
                  <div className="font-display text-sm text-blue-400">{nickname}</div>
                  <div className="text-xs text-gray-600 font-mono">Bronze · 1000 ELO</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="px-4 py-3 rounded-lg text-sm font-mono text-gray-600 hover:text-gray-400 transition-colors"
                  onClick={() => setStep('nickname')}
                >← Back</button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-lg font-display text-base uppercase tracking-widest border-2 transition-all"
                  style={{
                    borderColor: '#ffd700',
                    color: '#ffd700',
                    background: 'rgba(255,215,0,0.05)',
                    boxShadow: '0 0 20px rgba(255,215,0,0.1)',
                  }}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? '⏳ Joining...' : '🚀 Enter Battle'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 justify-center mt-6 pt-6 border-t border-white border-opacity-5">
            {['⚡ Real-time', '🎮 Multiplayer', '🏆 Ranked', '💬 Chat'].map(f => (
              <span key={f} className="text-xs font-mono text-gray-700 px-2 py-1 rounded border border-white border-opacity-5">
                {f}
              </span>
            ))}
          </div>

          {/* Creator credit */}
          <div className="text-center mt-4">
            <span className="text-xs font-mono" style={{ color: 'rgba(0,245,255,0.3)' }}>
              Created by{' '}
              <span
                className="font-bold"
                style={{ color: 'rgba(0,245,255,0.6)', textShadow: '0 0 8px rgba(0,245,255,0.3)' }}
              >
                Asen Chochev
              </span>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
