import { motion, AnimatePresence } from 'framer-motion';
import { PiecePreview } from './TetrisBoard';
import { useGameStore } from '../../store/gameStore';

const RANK_COLORS = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Diamond: '#b9f2ff',
  Master: '#ff00ff',
};

function StatBox({ label, value, color = '#00f5ff', large = false }) {
  return (
    <div className="glass rounded p-3 border border-opacity-20" style={{ borderColor: color }}>
      <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: `${color}88` }}>
        {label}
      </div>
      <div
        className={`font-display font-bold ${large ? 'text-2xl' : 'text-xl'}`}
        style={{ color, textShadow: `0 0 10px ${color}` }}
      >
        {value}
      </div>
    </div>
  );
}

function PieceBox({ label, pieceType, color = '#00f5ff' }) {
  return (
    <div className="glass rounded p-3 border border-opacity-20" style={{ borderColor: color }}>
      <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: `${color}88` }}>
        {label}
      </div>
      <div className="flex items-center justify-center" style={{ minHeight: '80px' }}>
        {pieceType ? (
          <PiecePreview pieceType={pieceType} size={4} />
        ) : (
          <div className="text-gray-700 text-xs">—</div>
        )}
      </div>
    </div>
  );
}

export function GameHUD({ gameState, isOpponent = false }) {
  const { players, socket } = useGameStore();
  const myPlayer = players.find(p => p.id === socket?.id);
  const player = isOpponent
    ? players.find(p => p.id !== socket?.id)
    : myPlayer;

  if (!gameState) return null;

  const { score, level, lines, nextPiece, heldPiece, lives, paused } = gameState;
  const color = isOpponent ? '#ff3366' : '#00f5ff';
  const rankColor = RANK_COLORS[player?.rank || 'Bronze'];

  return (
    <div className="flex flex-col gap-2 w-32">
      {/* Player info */}
      {player && (
        <div className="glass rounded p-2 border border-opacity-20" style={{ borderColor: color }}>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-lg">{player.avatar || '🎮'}</span>
            <div>
              <div className="font-display text-xs truncate" style={{ color }}>
                {player.nickname}
              </div>
              <div className="text-xs font-mono" style={{ color: rankColor }}>
                {player.rank || 'Bronze'}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isOpponent && (
        <PieceBox label="Hold" pieceType={heldPiece?.type} color="#bf00ff" />
      )}

      <StatBox label="Score" value={score?.toLocaleString() || 0} color={color} large />
      <StatBox label="Level" value={level || 1} color="#bf00ff" />
      <StatBox label="Lines" value={lines || 0} color="#00ff88" />

      {!isOpponent && (
        <PieceBox label="Next" pieceType={nextPiece?.type} color={color} />
      )}

      {paused && !isOpponent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded p-2 text-center"
          style={{ borderColor: '#ffd700', border: '1px solid #ffd700' }}
        >
          <div className="font-display text-xs text-yellow-400">PAUSED</div>
        </motion.div>
      )}
    </div>
  );
}

export function OpponentMiniBoard({ gameState, player }) {
  return (
    <div className="glass rounded overflow-hidden border border-opacity-10 border-red-500">
      <div className="flex items-center gap-2 px-2 py-1 bg-red-500 bg-opacity-10">
        <span className="text-sm">{player?.avatar || '🎮'}</span>
        <span className="font-display text-xs text-red-400 truncate">{player?.nickname}</span>
        <span className="ml-auto font-mono text-xs text-red-300">
          {player?.score?.toLocaleString() || 0}
        </span>
      </div>
    </div>
  );
}

export function GarbageWarning({ lines }) {
  return (
    <AnimatePresence>
      {lines > 0 && (
        <motion.div
          key={Date.now()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 font-display text-red-400 text-sm font-bold"
          style={{ textShadow: '0 0 10px #ff3366' }}
        >
          +{lines} ⚠️
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MobileControls({ onAction, ACTIONS }) {
  const btn = (action, label, cls = '') => (
    <button
      className={`glass rounded flex items-center justify-center text-lg font-bold select-none
        active:scale-90 transition-transform ${cls}`}
      style={{ minWidth: 48, minHeight: 48, border: '1px solid rgba(0,245,255,0.3)' }}
      onTouchStart={(e) => { e.preventDefault(); onAction(action); }}
      onClick={() => onAction(action)}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed bottom-4 left-0 right-0 flex flex-col items-center gap-2 px-4 md:hidden z-50">
      <div className="flex gap-2 justify-center">
        {btn(ACTIONS.ROTATE_CCW, '↺', 'text-purple-400')}
        {btn(ACTIONS.ROTATE, '↻', 'text-purple-400')}
        {btn(ACTIONS.HOLD, 'H', 'text-purple-400')}
      </div>
      <div className="flex gap-2">
        {btn(ACTIONS.MOVE_LEFT, '◀')}
        {btn(ACTIONS.SOFT_DROP, '▼', 'text-blue-400')}
        {btn(ACTIONS.MOVE_RIGHT, '▶')}
      </div>
      <div className="flex gap-2">
        {btn(ACTIONS.HARD_DROP, '⬇', 'text-neon-green col-span-3 w-36 text-xl')}
      </div>
    </div>
  );
}
