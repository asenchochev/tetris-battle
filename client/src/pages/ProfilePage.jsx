import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import toast from 'react-hot-toast';

const AVATARS = ['🎮','👾','🤖','👻','🦊','🐉','🦁','🐺','🦅','🎯','⚡','🔥','💀','🌟','🚀','🎲'];
const RANK_COLORS = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Diamond: '#b9f2ff', Master: '#ff00ff' };

export default function ProfilePage() {
  const { user, setUser, settings, updateSettings } = useGameStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🎮');

  if (!user) return null;

  const rankColor = RANK_COLORS[user.rank] || '#cd7f32';
  const winRate = user.totalGames > 0 ? Math.round(user.wins / user.totalGames * 100) : 0;

  const saveAvatar = () => {
    setUser({ ...user, avatar: selectedAvatar });
    toast.success('Avatar updated!');
  };

  const sections = ['profile', 'settings', 'achievements'];

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-5 mb-4 border flex-shrink-0"
        style={{ borderColor: `${rankColor}33` }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl glass"
              style={{ border: `2px solid ${rankColor}66` }}>
              {user.avatar || '🎮'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2"
              style={{ borderColor: '#050510' }} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-white">{user.nickname}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span style={{ color: rankColor }} className="text-lg">
                {user.rank === 'Bronze' ? '🥉' : user.rank === 'Silver' ? '🥈' : user.rank === 'Gold' ? '🥇' : user.rank === 'Diamond' ? '💎' : '👑'}
              </span>
              <span className="font-mono text-sm" style={{ color: rankColor }}>{user.rank || 'Bronze'}</span>
              <span className="text-gray-600 font-mono text-xs">· {user.elo || 1000} ELO</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-black" style={{ color: '#00ff88' }}>{winRate}%</div>
            <div className="text-xs text-gray-500 font-mono">Win Rate</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Games', value: user.totalGames || 0, color: '#00f5ff' },
            { label: 'Wins', value: user.wins || 0, color: '#00ff88' },
            { label: 'Losses', value: user.losses || 0, color: '#ff3366' },
            { label: 'Best Score', value: (user.bestScore || 0).toLocaleString(), color: '#ffd700' },
          ].map(stat => (
            <div key={stat.label} className="text-center glass rounded p-2">
              <div className="font-display text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-gray-600 font-mono">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-4 flex-shrink-0">
        {sections.map(s => (
          <button key={s}
            className={`px-4 py-1.5 rounded text-xs font-display uppercase tracking-wider transition-all ${activeSection === s ? 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-40' : 'text-gray-600 hover:text-gray-400'}`}
            onClick={() => setActiveSection(s)}
          >{s}</button>
        ))}
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass rounded-xl p-4 border border-white border-opacity-5">
              <h3 className="font-display text-sm text-blue-400 mb-3 uppercase tracking-wider">Choose Avatar</h3>
              <div className="grid grid-cols-8 gap-2">
                {AVATARS.map(av => (
                  <button key={av}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110 ${selectedAvatar === av ? 'ring-2 ring-blue-400 bg-blue-500 bg-opacity-20' : 'glass hover:bg-white hover:bg-opacity-5'}`}
                    onClick={() => setSelectedAvatar(av)}
                  >{av}</button>
                ))}
              </div>
              {selectedAvatar !== user.avatar && (
                <button className="btn-primary mt-3 text-sm" onClick={saveAvatar}>Save Avatar</button>
              )}
            </div>

            {/* ELO progress */}
            <div className="glass rounded-xl p-4 border border-white border-opacity-5">
              <h3 className="font-display text-sm text-blue-400 mb-3 uppercase tracking-wider">Rank Progress</h3>
              <div className="space-y-2">
                {[
                  { name: 'Bronze', min: 0, max: 999, color: '#cd7f32' },
                  { name: 'Silver', min: 1000, max: 1999, color: '#c0c0c0' },
                  { name: 'Gold', min: 2000, max: 2999, color: '#ffd700' },
                  { name: 'Diamond', min: 3000, max: 3999, color: '#b9f2ff' },
                  { name: 'Master', min: 4000, max: 5000, color: '#ff00ff' },
                ].map(rank => {
                  const elo = user.elo || 1000;
                  const progress = Math.min(100, Math.max(0, ((elo - rank.min) / (rank.max - rank.min)) * 100));
                  const isCurrentRank = elo >= rank.min && elo <= rank.max;
                  return (
                    <div key={rank.name}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span style={{ color: rank.color }}>{rank.name}</span>
                        <span className="text-gray-600">{rank.min}–{rank.max}</span>
                      </div>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${isCurrentRank ? progress : elo >= rank.min ? 100 : 0}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: rank.color, boxShadow: isCurrentRank ? `0 0 8px ${rank.color}` : 'none' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass rounded-xl p-4 border border-white border-opacity-5">
              <h3 className="font-display text-sm text-blue-400 mb-4 uppercase tracking-wider">Audio</h3>
              {[
                { label: 'SFX Volume', key: 'sfxVolume' },
                { label: 'Music Volume', key: 'musicVolume' },
              ].map(({ label, key }) => (
                <div key={key} className="mb-4">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-blue-400">{Math.round(settings[key] * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={settings[key]}
                    onChange={e => updateSettings({ [key]: parseFloat(e.target.value) })}
                    className="w-full accent-blue-400"
                  />
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-4 border border-white border-opacity-5">
              <h3 className="font-display text-sm text-blue-400 mb-4 uppercase tracking-wider">Game Options</h3>
              {[
                { label: 'Ghost Piece', key: 'ghostPiece' },
                { label: 'Show Grid', key: 'showGrid' },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">{label}</span>
                  <button
                    className={`w-10 h-6 rounded-full border transition-all relative ${settings[key] ? 'bg-blue-500 border-blue-400' : 'bg-gray-800 border-gray-600'}`}
                    onClick={() => updateSettings({ [key]: !settings[key] })}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings[key] ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-4 border border-white border-opacity-5">
              <h3 className="font-display text-sm text-blue-400 mb-4 uppercase tracking-wider">Key Bindings</h3>
              {Object.entries(settings.keyBindings).map(([action, key]) => (
                <div key={action} className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono capitalize">{action}</span>
                  <kbd className="px-2 py-1 rounded text-xs font-mono bg-gray-900 border border-gray-700 text-gray-300">
                    {key === ' ' ? 'Space' : key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'achievements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🎯', name: 'First Blood', desc: 'Win your first game', unlocked: (user.wins || 0) >= 1 },
                { icon: '🔥', name: 'On Fire', desc: 'Win 10 games', unlocked: (user.wins || 0) >= 10 },
                { icon: '💎', name: 'Diamond Player', desc: 'Reach Diamond rank', unlocked: ['Diamond','Master'].includes(user.rank) },
                { icon: '🧱', name: 'Line Breaker', desc: 'Clear 100 lines total', unlocked: (user.totalLines || 0) >= 100 },
                { icon: '👑', name: 'Master', desc: 'Reach Master rank', unlocked: user.rank === 'Master' },
                { icon: '⚡', name: 'Speed Demon', desc: 'Reach level 10', unlocked: false },
                { icon: '🎮', name: 'Veteran', desc: 'Play 50 games', unlocked: (user.totalGames || 0) >= 50 },
                { icon: '🏆', name: 'Champion', desc: 'Win 50 games', unlocked: (user.wins || 0) >= 50 },
              ].map(ach => (
                <div key={ach.name}
                  className={`glass rounded-xl p-4 border transition-all ${ach.unlocked ? 'border-yellow-500 border-opacity-40' : 'border-white border-opacity-5 opacity-50'}`}
                >
                  <div className="text-3xl mb-2">{ach.unlocked ? ach.icon : '🔒'}</div>
                  <div className={`font-display text-sm ${ach.unlocked ? 'text-yellow-400' : 'text-gray-600'}`}>{ach.name}</div>
                  <div className="text-xs text-gray-600 font-mono mt-1">{ach.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
