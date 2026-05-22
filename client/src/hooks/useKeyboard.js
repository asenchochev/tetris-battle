import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSound } from './useSound';

const ACTIONS = {
  MOVE_LEFT: 'moveLeft',
  MOVE_RIGHT: 'moveRight',
  ROTATE: 'rotate',
  ROTATE_CCW: 'rotateCCW',
  SOFT_DROP: 'softDrop',
  HARD_DROP: 'hardDrop',
  HOLD: 'hold',
};

const DAS_DELAY = 150; // ms before auto-repeat
const ARR_RATE = 50;   // ms between repeats

export function useKeyboard(enabled = true) {
  const { socket, settings, gameStatus } = useGameStore();
  const sounds = useSound();
  const pressedKeys = useRef(new Set());
  const dasTimers = useRef({});
  const arrTimers = useRef({});

  const sendAction = useCallback((action) => {
    if (!socket || gameStatus !== 'playing') return;
    socket.emit('game:action', action);

    // Play sounds
    switch (action) {
      case ACTIONS.MOVE_LEFT:
      case ACTIONS.MOVE_RIGHT:
        sounds.move(); break;
      case ACTIONS.ROTATE:
      case ACTIONS.ROTATE_CCW:
        sounds.rotate(); break;
      case ACTIONS.HARD_DROP:
        sounds.drop(); break;
      case ACTIONS.HOLD:
        sounds.hold(); break;
    }
  }, [socket, gameStatus, sounds]);

  const getActionForKey = useCallback((key) => {
    const kb = settings.keyBindings;
    if (key === kb.left) return ACTIONS.MOVE_LEFT;
    if (key === kb.right) return ACTIONS.MOVE_RIGHT;
    if (key === kb.rotate) return ACTIONS.ROTATE;
    if (key === kb.rotateCCW) return ACTIONS.ROTATE_CCW;
    if (key === kb.softDrop) return ACTIONS.SOFT_DROP;
    if (key === kb.hardDrop) return ACTIONS.HARD_DROP;
    if (key === kb.hold) return ACTIONS.HOLD;
    return null;
  }, [settings.keyBindings]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const key = e.key;

      // Pause
      if (key === settings.keyBindings.pause) {
        socket?.emit('game:pause');
        return;
      }

      if (pressedKeys.current.has(key)) return;
      pressedKeys.current.add(key);

      const action = getActionForKey(key);
      if (!action) return;

      e.preventDefault();
      sendAction(action);

      // DAS for movement keys
      if (action === ACTIONS.MOVE_LEFT || action === ACTIONS.MOVE_RIGHT || action === ACTIONS.SOFT_DROP) {
        dasTimers.current[key] = setTimeout(() => {
          arrTimers.current[key] = setInterval(() => {
            sendAction(action);
          }, ARR_RATE);
        }, DAS_DELAY);
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key;
      pressedKeys.current.delete(key);

      if (dasTimers.current[key]) {
        clearTimeout(dasTimers.current[key]);
        delete dasTimers.current[key];
      }
      if (arrTimers.current[key]) {
        clearInterval(arrTimers.current[key]);
        delete arrTimers.current[key];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      Object.values(dasTimers.current).forEach(clearTimeout);
      Object.values(arrTimers.current).forEach(clearInterval);
    };
  }, [enabled, sendAction, getActionForKey, settings.keyBindings, socket]);

  // Mobile touch controls
  const handleMobileAction = useCallback((action) => {
    sendAction(action);
  }, [sendAction]);

  return { handleMobileAction, ACTIONS };
}
