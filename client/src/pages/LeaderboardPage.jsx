import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const RANK_COLORS = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Diamond: '#b9f2ff', Master: '#ff00ff' };
const RANK_ICONS = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Diamond: '💎', Master: '👑' };

const POSITION_STYLES = {
  1: { color: '#ffd700', bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.3)', size: 'text-2xl' },
  2: { color: '#c0c0c0', bg: 'rgba(192,192,192,0.06)', border: 'rgba(192,192,192,0.2)', size: 'text-xl' },
  3: { color: '#cd7f32', bg: 'rgba(205,127,50,0.06)', border: 'rgba(205,127,50,0.2)', size: 'text-xl' },
};

export default function LeaderboardPage() {
  const { leaderboard, socket, user } = useGameStore();

  useEffect(() => {
    socket?.emit('leaderboard:get');
  }, [socket]);

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: '#ffd700', textShadow: '0 0 15px #ffd700' }}>
            LEADERBOARD
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">Top players worldwide</p>
        </div>
        <button
          className="text-xs text-blue-400 font-mono border border-blue-500 border-opacity-30 px-3 py-1.5 rounded hover:bg-blue-500 hover:bg-opacity-10 transition-all"
          onClick={() => socket?.emit('leaderboard:get')}
        >↻ Refresh</button>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6 flex-shrink-0">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((player, i) => {
            const pos = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ['h-20', 'h-28', 'h-16'];
            const style = POSITION_STYLES[pos];
            return (
              <motion.div
                key={player.nickname}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex-1 max-w-32 ${heights[i]} flex flex-col items-center justify-end pb-3 rounded-t-lg border`}
                style={{ background: style.bg, borderColor: style.border, borderBottomWidth: 0 }}
              >
                <div className="text-2xl mb-1">{player.avatar || '🎮'}</div>
                <div className="font-display text-xs truncate px-1" style={{ color: style.color }}>{player.nickname}</div>
                <div className="font-mono text-xs text-gray-500">{player.elo} ELO</div>
                <div className="font-display text-lg font-black" style={{ color: style.color }}>
                  #{pos}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {leaderboard.map((player, index) => {
          const pos = index + 1;
          const isMe = player.nickname === user?.nickname;
          const style = POSITION_STYLES[pos] || {};
          const rankColor = RANK_COLORS[player.rankName] || '#cd7f32';

          return (
            <motion.div
              key={player.nickname}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
              className="glass rounded-lg px-4 py-3 flex items-center gap-4 border transition-all"
              style={{
                borderColor: isMe ? 'rgba(0,245,255,0.4)' : style.border || 'rgba(255,255,255,0.05)',
                background: isMe ? 'rgba(0,245,255,0.05)' : style.bg || 'rgba(5,5,16,0.7)',
              }}
            >
              {/* Position */}
              <div className={`w-8 text-center font-display font-black ${style.size || 'text-base'}`}
                style={{ color: style.color || '#555' }}>
                {pos <= 3 ? ['🥇','🥈','🥉'][pos-1] : `#${pos}`}
              </div>

              {/* Avatar */}
              <div className="text-xl">{player.avatar || '🎮'}</div>

              {/* Name & rank */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm truncate" style={{ color: isMe ? '#00f5ff' : '#e0e0ff' }}>
                    {player.nickname}
                  </span>
                  {isMe && <span className="text-xs text-blue-400 font-mono">(you)</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span style={{ color: rankColor }}>{RANK_ICONS[player.rankName] || '🥉'}</span>
                  <span className="text-xs font-mono" style={{ color: rankColor }}>{player.rankName}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-right">
                <div>
                  <div className="font-display text-sm font-bold text-blue-400">{player.elo}</div>
                  <div className="text-xs text-gray-600 font-mono">ELO</div>
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-green-400">{player.wins}</div>
                  <div className="text-xs text-gray-600 font-mono">Wins</div>
                </div>
                <div className="hidden sm:block">
                  <div className="font-display text-sm font-bold text-gray-400">
                    {player.wins + player.losses > 0
                      ? Math.round(player.wins / (player.wins + player.losses) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-600 font-mono">WR</div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-700">
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-display text-sm">No rankings yet</div>
            <div className="text-xs mt-1">Play some games to appear here!</div>
          </div>
        )}
      </div>
    </div>
  );
}
