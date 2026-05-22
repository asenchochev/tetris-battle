import { useRef, useEffect, useCallback } from 'react';
import { TETROMINOES } from '@shared/constants.esm.js';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

export function TetrisBoard({ gameState, mini = false, playerId = null }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const CELL_SIZE = mini ? 14 : 30;
  const CANVAS_W = BOARD_WIDTH * CELL_SIZE;
  const CANVAS_H = BOARD_HEIGHT * CELL_SIZE;

  const drawCell = useCallback((ctx, x, y, color, alpha = 1, isGhost = false) => {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const size = CELL_SIZE;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (isGhost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
      ctx.restore();
      return;
    }

    // Main cell fill
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

    // Highlight top-left
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(px + 1, py + 1, size - 2, 3);
    ctx.fillRect(px + 1, py + 1, 3, size - 2);

    // Shadow bottom-right
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
    ctx.fillRect(px + size - 4, py + 1, 3, size - 2);

    // Inner glow
    if (!mini) {
      const gradient = ctx.createRadialGradient(
        px + size / 2, py + size / 2, 0,
        px + size / 2, py + size / 2, size / 2
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    }

    ctx.restore();
  }, [CELL_SIZE, mini]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = mini ? 'rgba(2,2,15,0.9)' : 'rgba(2,2,15,0.95)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!gameState) {
      // Empty board
      if (!mini) {
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= BOARD_WIDTH; x++) {
          ctx.beginPath();
          ctx.moveTo(x * CELL_SIZE, 0);
          ctx.lineTo(x * CELL_SIZE, CANVAS_H);
          ctx.stroke();
        }
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
          ctx.beginPath();
          ctx.moveTo(0, y * CELL_SIZE);
          ctx.lineTo(CANVAS_W, y * CELL_SIZE);
          ctx.stroke();
        }
      }
      return;
    }

    const { board, currentPiece, ghostY, heldPiece } = gameState;

    // Grid lines
    if (!mini) {
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CANVAS_W, y * CELL_SIZE);
        ctx.stroke();
      }
    }

    // Draw board cells
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const cell = board?.[row]?.[col];
        if (cell) {
          const isGarbage = cell.type === 'G';
          drawCell(ctx, col, row, isGarbage ? '#334' : cell.color);
        }
      }
    }

    // Draw ghost piece
    if (currentPiece && !mini && ghostY !== undefined) {
      const ghost = currentPiece;
      for (let row = 0; row < ghost.shape.length; row++) {
        for (let col = 0; col < ghost.shape[row].length; col++) {
          if (ghost.shape[row][col]) {
            drawCell(ctx, ghost.x + col, ghostY + row, ghost.color, 1, true);
          }
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const py = currentPiece.y + row;
            if (py >= 0) {
              drawCell(ctx, currentPiece.x + col, py, currentPiece.color);
            }
          }
        }
      }
    }

    // Game over overlay
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      if (!mini) {
        ctx.fillStyle = '#ff3366';
        ctx.font = 'bold 20px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2);
      }
    }
  }, [gameState, CANVAS_W, CANVAS_H, CELL_SIZE, mini, drawCell]);

  useEffect(() => {
    const loop = () => {
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
}

// Mini preview for next/hold pieces
export function PiecePreview({ pieceType, size = 4 }) {
  const canvasRef = useRef(null);
  const CELL = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!pieceType) return;

    const def = TETROMINOES[pieceType];
    if (!def) return;

    const shape = def.shape;
    const color = def.color;
    const rows = shape.length;
    const cols = shape[0].length;
    const offsetX = Math.floor((size - cols) / 2);
    const offsetY = Math.floor((size - rows) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          const px = (offsetX + c) * CELL;
          const py = (offsetY + r) * CELL;

          ctx.fillStyle = color;
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);

          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(px + 1, py + 1, CELL - 2, 3);
          ctx.fillRect(px + 1, py + 1, 3, CELL - 2);

          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(px + 1, py + CELL - 4, CELL - 2, 3);
        }
      }
    }
  }, [pieceType, size, CELL]);

  return (
    <canvas
      ref={canvasRef}
      width={size * CELL}
      height={size * CELL}
      style={{ display: 'block' }}
    />
  );
}
