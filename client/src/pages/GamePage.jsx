import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TetrisBoard } from '../components/game/TetrisBoard';
import { GameHUD, MobileControls, GarbageWarning } from '../components/game/GameHUD';
import { useGameStore } from '../store/gameStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSound } from '../hooks/useSound';

export default function GamePage() {
  const {
    gameState,
    opponentStates,
    players,
    gameStatus,
    winner,
    socket,
    lastGarbage,
    setActiveTab,
    setGameStatus,
    currentRoom
  } = useGameStore();

  const sounds = useSound();
  const prevLines = useRef(0);
  const prevLevel = useRef(1);
  const { handleMobileAction, ACTIONS } = useKeyboard(gameStatus === 'playing');

  // Play sounds on game events
  useEffect(() => {
    if (!gameState) return;
    const { lines, level, gameOver } = gameState;

    if (lines > prevLines.current) {
      const cleared = lines - prevLines.current;
      if (cleared === 4) sounds.tetris();
      else sounds.lineClear(cleared);
    }
    if (level > prevLevel.current) sounds.levelUp();
    if (gameOver && gameStatus !== 'won') sounds.gameOver();

    prevLines.current = lines;
    prevLevel.current = level;
  }, [gameState?.lines, gameState?.level, gameState?.gameOver]);

  useEffect(() => {
    if (gameStatus === 'won') sounds.win();
  }, [gameStatus]);

  useEffect(() => {
    if (lastGarbage) sounds.garbage();
  }, [lastGarbage]);

  const opponentIds = Object.keys(opponentStates);
  const opponentPlayer = players.find(p => p.id !== socket?.id);
  const myPlayer = players.find(p => p.id === socket?.id);

  const handleRestart = () => {
    socket?.emit('lobby:leaveRoom');
    setGameStatus('idle');
    setActiveTab('lobby');
  };

  const handlePause = () => {
    socket?.emit('game:pause');
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 opacity-5 rounded-full blur-3xl" />
      </div>

      {/* Game arena */}
      <div className="relative flex items-start justify-center gap-4 p-4 z-10">

        {/* === MY BOARD === */}
        <div className="flex gap-3 items-start">
          <GameHUD gameState={gameState} isOpponent={false} />

          <div className="relative">
            <div
              className="relative rounded overflow-hidden"
              style={{
                border: '2px solid rgba(0, 245, 255, 0.4)',
                boxShadow: '0 0 30px rgba(0, 245, 255, 0.15), inset 0 0 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              <TetrisBoard gameState={gameState} />

              {/* Garbage indicator */}
              <GarbageWarning lines={lastGarbage?.lines || 0} />
            </div>

            {/* Board label */}
            <div className="text-center mt-2 font-display text-xs text-blue-400 opacity-60 uppercase tracking-widest">
              {myPlayer?.nickname || 'You'}
            </div>
          </div>
        </div>

        {/* === VS DIVIDER === */}
        <div className="flex flex-col items-center justify-center h-full self-center gap-3 px-2">
          <div className="font-display text-2xl font-black"
            style={{ color: '#bf00ff', textShadow: '0 0 20px #bf00ff' }}>
            VS
          </div>
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
        </div>

        {/* === OPPONENT BOARD === */}
        {opponentIds.map(opId => (
          <div key={opId} className="flex gap-3 items-start">
            <div className="relative">
              <div
                className="relative rounded overflow-hidden"
                style={{
                  border: '2px solid rgba(255, 51, 102, 0.4)',
                  boxShadow: '0 0 30px rgba(255, 51, 102, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)'
                }}
              >
                <TetrisBoard gameState={opponentStates[opId]} />
              </div>
              <div className="text-center mt-2 font-display text-xs text-red-400 opacity-60 uppercase tracking-widest">
                {opponentPlayer?.nickname || 'Opponent'}
              </div>
            </div>

            <GameHUD gameState={opponentStates[opId]} isOpponent={true} />
          </div>
        ))}

        {/* Waiting for opponent */}
        {opponentIds.length === 0 && gameStatus === 'playing' && (
          <div className="flex flex-col items-center justify-center w-64 h-96 glass rounded border border-gray-700">
            <div className="font-display text-gray-500 text-sm">Waiting for opponent...</div>
          </div>
        )}
      </div>

      {/* === Game Over / Win Overlay === */}
      <AnimatePresence>
        {(gameStatus === 'over' || gameStatus === 'won') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="glass rounded-2xl p-10 text-center max-w-md w-full mx-4"
              style={{
                border: `2px solid ${gameStatus === 'won' ? '#ffd700' : '#ff3366'}`,
                boxShadow: `0 0 60px ${gameStatus === 'won' ? '#ffd70033' : '#ff336633'}`
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                {gameStatus === 'won' ? '🏆' : '💀'}
              </motion.div>

              <h2
                className="font-display text-4xl font-black mb-2"
                style={{
                  color: gameStatus === 'won' ? '#ffd700' : '#ff3366',
                  textShadow: `0 0 20px ${gameStatus === 'won' ? '#ffd700' : '#ff3366'}`
                }}
              >
                {gameStatus === 'won' ? 'VICTORY!' : 'DEFEATED'}
              </h2>

              <div className="font-body text-gray-400 mb-6">
                {gameStatus === 'won' ? 'You are the last one standing!' : 'Better luck next time!'}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">SCORE</div>
                  <div className="font-display text-xl text-blue-400">
                    {gameState?.score?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="glass rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">LINES</div>
                  <div className="font-display text-xl text-green-400">
                    {gameState?.lines || 0}
                  </div>
                </div>
                <div className="glass rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">LEVEL</div>
                  <div className="font-display text-xl text-purple-400">
                    {gameState?.level || 1}
                  </div>
                </div>
                <div className="glass rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">RESULT</div>
                  <div className={`font-display text-xl ${gameStatus === 'won' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {gameStatus === 'won' ? 'WIN' : 'LOSS'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  className="btn-primary"
                  onClick={handleRestart}
                >
                  🔄 Play Again
                </button>
                <button
                  className="btn-danger"
                  onClick={() => { setActiveTab('lobby'); socket?.emit('lobby:leaveRoom'); }}
                >
                  🏠 Lobby
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden md:flex gap-4 text-xs text-gray-700 font-mono">
        <span>←→ Move</span>
        <span>↑ Rotate</span>
        <span>↓ Soft Drop</span>
        <span>Space Hard Drop</span>
        <span>C Hold</span>
        <span>Esc Pause</span>
      </div>

      {/* Mobile controls */}
      <MobileControls onAction={handleMobileAction} ACTIONS={ACTIONS} />
    </div>
  );
}
