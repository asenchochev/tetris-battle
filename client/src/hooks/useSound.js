import { useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

// Generate tones using Web Audio API
function createAudioContext() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(ctx, frequency, duration, type = 'square', volume = 0.3, startTime = 0) {
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    oscillator.start(ctx.currentTime + startTime);
    oscillator.stop(ctx.currentTime + startTime + duration);
  } catch (e) {}
}

export function useSound() {
  const audioCtxRef = useRef(null);
  const { settings } = useGameStore();

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const sounds = {
    move: useCallback(() => {
      const ctx = getCtx();
      const vol = settings.sfxVolume * 0.15;
      playTone(ctx, 220, 0.05, 'square', vol);
    }, [getCtx, settings.sfxVolume]),

    rotate: useCallback(() => {
      const ctx = getCtx();
      playTone(ctx, 330, 0.07, 'triangle', settings.sfxVolume * 0.2);
    }, [getCtx, settings.sfxVolume]),

    drop: useCallback(() => {
      const ctx = getCtx();
      const vol = settings.sfxVolume * 0.3;
      playTone(ctx, 150, 0.1, 'square', vol);
      playTone(ctx, 100, 0.15, 'square', vol * 0.5, 0.05);
    }, [getCtx, settings.sfxVolume]),

    lineClear: useCallback((lines) => {
      const ctx = getCtx();
      const vol = settings.sfxVolume * 0.5;
      const freqs = lines === 4
        ? [261, 329, 392, 523, 659, 784]
        : [261, 329, 392, 523];
      freqs.forEach((f, i) => playTone(ctx, f, 0.15, 'square', vol, i * 0.05));
    }, [getCtx, settings.sfxVolume]),

    tetris: useCallback(() => {
      const ctx = getCtx();
      const vol = settings.sfxVolume * 0.6;
      [523, 659, 784, 1046].forEach((f, i) => {
        playTone(ctx, f, 0.2, 'square', vol, i * 0.08);
      });
    }, [getCtx, settings.sfxVolume]),

    garbage: useCallback(() => {
      const ctx = getCtx();
      playTone(ctx, 80, 0.3, 'sawtooth', settings.sfxVolume * 0.4);
    }, [getCtx, settings.sfxVolume]),

    gameOver: useCallback(() => {
      const ctx = getCtx();
      const vol = settings.sfxVolume * 0.5;
      [523, 440, 349, 262].forEach((f, i) => {
        playTone(ctx, f, 0.3, 'square', vol, i * 0.15);
      });
    }, [getCtx, settings.sfxVolume]),

    win: useCallback(() => {
      const ctx = getCtx();
      const vol = settings.sfxVolume * 0.5;
      [523, 659, 784, 1046, 1319].forEach((f, i) => {
        playTone(ctx, f, 0.25, 'triangle', vol, i * 0.1);
      });
    }, [getCtx, settings.sfxVolume]),

    hold: useCallback(() => {
      const ctx = getCtx();
      playTone(ctx, 440, 0.08, 'triangle', settings.sfxVolume * 0.25);
    }, [getCtx, settings.sfxVolume]),

    levelUp: useCallback(() => {
      const ctx = getCtx();
      const vol = settings.sfxVolume * 0.5;
      [392, 523, 659, 784].forEach((f, i) => {
        playTone(ctx, f, 0.15, 'triangle', vol, i * 0.07);
      });
    }, [getCtx, settings.sfxVolume]),

    click: useCallback(() => {
      const ctx = getCtx();
      playTone(ctx, 800, 0.04, 'square', settings.sfxVolume * 0.15);
    }, [getCtx, settings.sfxVolume]),
  };

  return sounds;
}
