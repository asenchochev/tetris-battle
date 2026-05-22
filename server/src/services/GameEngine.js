'use strict';

const { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOES, SCORE_TABLE, LEVEL_SPEEDS, GARBAGE_TABLE } = require('../../../shared/constants');

class GameEngine {
  constructor(playerId) {
    this.playerId = playerId;
    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.heldPiece = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.lives = 3;
    this.gameOver = false;
    this.paused = false;
    this.garbageQueue = [];
    this.lastMoveTime = Date.now();
    this.dropInterval = LEVEL_SPEEDS[1];
    this.bag = [];
    this.spawnPiece();
  }

  createEmptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
  }

  // 7-bag randomizer for fair piece distribution
  refillBag() {
    const pieces = Object.keys(TETROMINOES);
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag.push(...pieces);
  }

  getNextFromBag() {
    if (this.bag.length < 7) this.refillBag();
    return this.bag.shift();
  }

  createPiece(type) {
    const def = TETROMINOES[type];
    return {
      type,
      shape: def.shape.map(row => [...row]),
      color: def.color,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(def.shape[0].length / 2),
      y: 0
    };
  }

  spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      this.currentPiece = this.createPiece(this.getNextFromBag());
    }
    this.nextPiece = this.createPiece(this.getNextFromBag());
    this.canHold = true;

    if (this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
      this.gameOver = true;
    }

    return !this.gameOver;
  }

  checkCollision(piece, x, y) {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && this.board[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  rotatePiece(piece, dir = 1) {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (dir === 1) {
          rotated[c][rows - 1 - r] = piece.shape[r][c];
        } else {
          rotated[cols - 1 - c][r] = piece.shape[r][c];
        }
      }
    }
    return rotated;
  }

  // SRS wall kicks
  getWallKicks(piece, dir) {
    const kicks = [
      [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]
    ];
    return kicks;
  }

  moveLeft() {
    if (!this.currentPiece || this.gameOver || this.paused) return false;
    if (!this.checkCollision(this.currentPiece, this.currentPiece.x - 1, this.currentPiece.y)) {
      this.currentPiece.x -= 1;
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this.currentPiece || this.gameOver || this.paused) return false;
    if (!this.checkCollision(this.currentPiece, this.currentPiece.x + 1, this.currentPiece.y)) {
      this.currentPiece.x += 1;
      return true;
    }
    return false;
  }

  rotate(dir = 1) {
    if (!this.currentPiece || this.gameOver || this.paused) return false;
    const rotated = this.rotatePiece(this.currentPiece, dir);
    const oldShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;
    
    const kicks = this.getWallKicks(this.currentPiece, dir);
    for (const [dx, dy] of kicks) {
      if (!this.checkCollision(this.currentPiece, this.currentPiece.x + dx, this.currentPiece.y + dy)) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        return true;
      }
    }
    
    this.currentPiece.shape = oldShape;
    return false;
  }

  softDrop() {
    if (!this.currentPiece || this.gameOver || this.paused) return false;
    if (!this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y += 1;
      this.score += 1;
      return true;
    }
    return this.lockPiece();
  }

  hardDrop() {
    if (!this.currentPiece || this.gameOver || this.paused) return 0;
    let dropDistance = 0;
    while (!this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y += 1;
      dropDistance++;
    }
    this.score += dropDistance * 2;
    return this.lockPiece() ? dropDistance : 0;
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece, this.currentPiece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  lockPiece() {
    if (!this.currentPiece) return false;
    const { shape, x, y, color, type } = this.currentPiece;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] && y + row >= 0) {
          this.board[y + row][x + col] = { color, type };
        }
      }
    }

    const cleared = this.clearLines();
    this.addPendingGarbage();
    
    if (!this.spawnPiece()) {
      this.gameOver = true;
    }

    return cleared;
  }

  clearLines() {
    const fullRows = [];
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== null)) {
        fullRows.push(row);
      }
    }

    if (fullRows.length === 0) return 0;

    // Remove full rows
    for (const row of fullRows) {
      this.board.splice(row, 1);
      this.board.unshift(Array(BOARD_WIDTH).fill(null));
    }

    const count = fullRows.length;
    this.lines += count;
    this.score += (SCORE_TABLE[count] || 0) * this.level;
    this.level = Math.floor(this.lines / 10) + 1;
    this.dropInterval = LEVEL_SPEEDS[Math.min(this.level, 10)] || 80;

    return count;
  }

  addGarbage(lines) {
    this.garbageQueue.push(lines);
  }

  addPendingGarbage() {
    if (this.garbageQueue.length === 0) return;
    const total = this.garbageQueue.reduce((a, b) => a + b, 0);
    this.garbageQueue = [];

    // Add garbage rows at bottom
    for (let i = 0; i < total; i++) {
      this.board.shift();
      const garbageRow = Array(BOARD_WIDTH).fill({ color: '#444466', type: 'G' });
      const hole = Math.floor(Math.random() * BOARD_WIDTH);
      garbageRow[hole] = null;
      this.board.push(garbageRow);
    }
  }

  hold() {
    if (!this.currentPiece || !this.canHold || this.gameOver || this.paused) return false;
    
    if (this.heldPiece) {
      const temp = this.createPiece(this.heldPiece.type);
      this.heldPiece = { type: this.currentPiece.type };
      this.currentPiece = temp;
    } else {
      this.heldPiece = { type: this.currentPiece.type };
      this.spawnPiece();
    }
    this.canHold = false;
    return true;
  }

  tick(now) {
    if (this.gameOver || this.paused) return null;
    
    if (now - this.lastMoveTime >= this.dropInterval) {
      this.lastMoveTime = now;
      if (this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1)) {
        const cleared = this.lockPiece();
        return cleared > 0 ? GARBAGE_TABLE[cleared] || 0 : 0;
      } else {
        this.currentPiece.y += 1;
      }
    }
    return null;
  }

  getState() {
    return {
      board: this.board,
      currentPiece: this.currentPiece,
      nextPiece: this.nextPiece,
      heldPiece: this.heldPiece,
      ghostY: this.getGhostY(),
      score: this.score,
      level: this.level,
      lines: this.lines,
      lives: this.lives,
      gameOver: this.gameOver,
      paused: this.paused
    };
  }

  pause() { this.paused = !this.paused; }
  
  reset() {
    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.heldPiece = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.paused = false;
    this.garbageQueue = [];
    this.bag = [];
    this.dropInterval = LEVEL_SPEEDS[1];
    this.spawnPiece();
  }
}

module.exports = GameEngine;
