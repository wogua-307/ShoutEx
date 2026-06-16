import { COLORS, SCREEN } from '../core/constants.js';
import { drawGameIcon } from '../assets/pixel-sprites.js';
import {
  drawBackIconButton,
  drawButton,
  drawMeter,
  drawPanel,
  drawPixelText,
  drawRoundedPanel,
  hitTest,
} from '../ui/pixel-ui.js';
import GameSettingsOverlay from '../ui/game-settings-overlay.js';
import HistoryOverlay from '../ui/history-overlay.js';
import { addGameHistory, getGameHistory } from '../core/game-history.js';
import { getHighScore, setHighScore } from '../core/storage.js';

const PHASE = {
  START: 'START',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
};

const STORAGE_KEY = 'shoutex.highScore.screamBird';

export default class ScreamBirdScene {
  constructor(options) {
    this.audio = options.audio;
    this.settings = options.settings;
    this.music = options.music;
    this.goToMenu = options.goToMenu;
    this.settingsOverlay = new GameSettingsOverlay(this.settings, this.music);
    this.historyOverlay = new HistoryOverlay({
      title: '尖叫小鸟',
      accent: COLORS.orange,
      getHistory: () => this.history,
    });
    this.phase = PHASE.START;
    this.time = 0;
    this.birdY = SCREEN.height * 0.48;
    this.velocity = 0;
    this.controlLevel = 0;
    this.pipes = [];
    this.spawnTimer = 2.0;
    this.score = 0;
    this.finalScore = 0;
    this.highScore = 0;
    this.history = [];
    this.pressedId = '';
    this.pressedTimer = 0;
    this.layout = {};
  }

  onEnter() {
    this.highScore = getHighScore(STORAGE_KEY);
    this.history = getGameHistory('SCREAM_BIRD');
    this.phase = PHASE.START;
    this.computeLayout();
    this.resetRun();
  }

  computeLayout() {
    const margin = 16;
    const top = Math.max(18, SCREEN.statusBarHeight, SCREEN.safeTop) + 12;
    const bottom = SCREEN.height - Math.max(18, SCREEN.safeBottom + 16);
    const panelW = SCREEN.width - margin * 2;
    const startPanelH = Math.min(300, Math.max(262, SCREEN.height * 0.46));
    const startPanelY = Math.max(top + 70, Math.min(SCREEN.height * 0.24, bottom - startPanelH - 72));
    const gameOverPanelH = Math.min(292, Math.max(258, SCREEN.height * 0.43));
    const gameOverPanelY = Math.max(top + 72, Math.min(SCREEN.height * 0.23, bottom - gameOverPanelH - 118));

    this.layout = {
      top,
      margin,
      backButton: { x: margin, y: top, w: 48, h: 44 },
      scorePill: {
        x: Math.round((SCREEN.width - 88) / 2),
        y: top,
        w: 88,
        h: 44,
      },
      startPanel: {
        x: margin,
        y: startPanelY,
        w: panelW,
        h: startPanelH,
      },
      gameOverPanel: {
        x: margin,
        y: gameOverPanelY,
        w: panelW,
        h: gameOverPanelH,
      },
      startButton: {
        x: margin,
        y: bottom - 58,
        w: SCREEN.width - margin * 2,
        h: 48,
      },
      restartButton: {
        x: margin,
        y: bottom - 112,
        w: SCREEN.width - margin * 2,
        h: 48,
      },
      menuButton: {
        x: margin,
        y: bottom - 56,
        w: SCREEN.width - margin * 2,
        h: 44,
      },
    };
    this.historyOverlay.setTopControls(top, margin, 56);
    this.settingsOverlay.setTopControls(top, margin + 56);
  }

  resetRun() {
    this.birdY = SCREEN.height * 0.48;
    this.velocity = 0;
    this.controlLevel = 0;
    this.pipes = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.finalScore = 0;
  }

  startGame() {
    this.resetRun();
    this.phase = PHASE.PLAYING;
  }

  update(frame) {
    this.time = frame.time;

    if (this.pressedTimer > 0) {
      this.pressedTimer -= frame.delta;
      if (this.pressedTimer <= 0) {
        this.pressedId = '';
      }
    }

    if (this.phase === PHASE.PLAYING) {
      this.updatePlaying(frame.delta);
    }
  }

  updatePlaying(dt) {
    const level = this.audio.getState().level;
    this.controlLevel += (level - this.controlLevel) * Math.min(1, dt * 4.5);

    const gravity = 560;
    const threshold = 16;
    const maxFall = 300;
    const maxRise = -250;
    const lift = this.controlLevel > threshold
      ? 360 + (this.controlLevel - threshold) * 7.2
      : this.controlLevel * 5;

    this.velocity += (gravity - lift) * dt;
    this.velocity *= Math.max(0.82, 1 - dt * 1.7);
    this.velocity = Math.max(maxRise, Math.min(maxFall, this.velocity));
    this.birdY += this.velocity * dt;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnPipe();
      this.spawnTimer = 1.95;
    }

    const speed = 128;
    for (let i = this.pipes.length - 1; i >= 0; i -= 1) {
      const pipe = this.pipes[i];
      pipe.x -= speed * dt;

      if (!pipe.passed && pipe.x + pipe.w < this.getBirdRect().x) {
        pipe.passed = true;
        this.score += 1;
      }

      if (pipe.x + pipe.w < -20) {
        this.pipes.splice(i, 1);
      }
    }

    if (this.checkCollision()) {
      this.gameOver();
    }
  }

  spawnPipe() {
    const gap = Math.max(250, SCREEN.height * 0.4);
    const topLimit = this.layout.top + 122;
    const bottomLimit = SCREEN.height - Math.max(82, SCREEN.safeBottom + 54);
    const minCenter = topLimit + gap / 2 + 30;
    const maxCenter = bottomLimit - gap / 2 - 30;
    const center = minCenter + Math.random() * Math.max(40, maxCenter - minCenter);

    this.pipes.push({
      x: SCREEN.width + 24,
      w: 58,
      gapTop: center - gap / 2,
      gapBottom: center + gap / 2,
      passed: false,
    });
  }

  checkCollision() {
    const bird = this.getBirdRect();

    if (bird.y < this.layout.top + 112 || bird.y + bird.h > SCREEN.height - Math.max(42, SCREEN.safeBottom + 20)) {
      return true;
    }

    return this.pipes.some((pipe) => {
      const overlapX = bird.x < pipe.x + pipe.w && bird.x + bird.w > pipe.x;
      if (!overlapX) {
        return false;
      }

      return bird.y < pipe.gapTop || bird.y + bird.h > pipe.gapBottom;
    });
  }

  gameOver() {
    this.phase = PHASE.GAMEOVER;
    this.finalScore = this.score;
    this.highScore = setHighScore(STORAGE_KEY, this.score);
    this.history = addGameHistory('SCREAM_BIRD', `得分 ${this.score}`);
  }

  getBirdRect() {
    const size = 42;
    return {
      x: SCREEN.width * 0.25 - size / 2,
      y: this.birdY - size / 2,
      w: size,
      h: size,
    };
  }

  render(ctx) {
    this.drawWorld(ctx);

    if (this.phase === PHASE.START) {
      this.drawStartOverlay(ctx);
    } else if (this.phase === PHASE.GAMEOVER) {
      this.drawGameOverOverlay(ctx);
    }

    this.settingsOverlay.drawModal(ctx);
    this.historyOverlay.drawModal(ctx);
  }

  drawWorld(ctx) {
    const gradient = ctx.createLinearGradient ? ctx.createLinearGradient(0, 0, 0, SCREEN.height) : null;
    if (gradient) {
      gradient.addColorStop(0, '#0C4A6E');
      gradient.addColorStop(0.58, '#111827');
      gradient.addColorStop(1, '#070B14');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = '#0C4A6E';
    }
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    this.drawCloudBlocks(ctx);
    this.drawPipes(ctx);
    this.drawBird(ctx);
    this.drawHud(ctx);
  }

  drawCloudBlocks(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    const offset = (this.time * 18) % 120;
    for (let i = 0; i < 5; i += 1) {
      const x = i * 120 - offset;
      const y = 150 + (i % 3) * 78;
      ctx.fillRect(x, y, 48, 12);
      ctx.fillRect(x + 18, y - 12, 40, 12);
      ctx.fillRect(x + 58, y, 34, 12);
    }
  }

  drawPipes(ctx) {
    this.pipes.forEach((pipe) => {
      this.drawPipe(ctx, pipe.x, 0, pipe.w, pipe.gapTop, true);
      this.drawPipe(ctx, pipe.x, pipe.gapBottom, pipe.w, SCREEN.height - pipe.gapBottom, false);
    });
  }

  drawPipe(ctx, x, y, w, h, topPipe) {
    if (h <= 0) {
      return;
    }

    ctx.fillStyle = COLORS.green;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#15803D';
    ctx.fillRect(x + w - 10, y, 10, h);
    ctx.fillStyle = '#86EFAC';
    ctx.fillRect(x + 8, y, 8, h);

    const capH = 24;
    const capY = topPipe ? y + h - capH : y;
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(x - 6, capY, w + 12, capH);
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 6, capY, w + 12, capH);
  }

  drawBird(ctx) {
    const bird = this.getBirdRect();
    ctx.save();
    ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
    ctx.rotate(Math.max(-0.45, Math.min(0.55, this.velocity / 760)));
    drawGameIcon(ctx, 'SCREAM_BIRD', -bird.w / 2, -bird.h / 2, bird.w, COLORS.orange);
    ctx.restore();

    const level = this.controlLevel;
    if (level > 40) {
      ctx.fillStyle = COLORS.yellow;
      ctx.globalAlpha = 0.72;
      ctx.fillRect(bird.x + bird.w + 5, bird.y + 12, 8, 8);
      ctx.fillRect(bird.x + bird.w + 18, bird.y + 4, 6, 6);
      ctx.fillRect(bird.x + bird.w + 18, bird.y + 24, 6, 6);
      ctx.globalAlpha = 1;
    }
  }

  drawHud(ctx) {
    drawBackIconButton(ctx, this.layout.backButton, {
      color: COLORS.panel,
      iconColor: COLORS.text,
      pressed: this.pressedId === 'BACK',
    });
    this.settingsOverlay.drawButton(ctx);
    this.historyOverlay.drawButton(ctx);

    if (this.phase === PHASE.PLAYING) {
      const scorePill = this.layout.scorePill;
      drawRoundedPanel(ctx, scorePill, {
        fill: 'rgba(7,11,20,0.62)',
        border: 'rgba(255,255,255,0.24)',
        radius: 18,
        glow: COLORS.orange,
        glowAlpha: 0.08,
        lineWidth: 2,
      });
      drawPixelText(ctx, `${this.score}`, scorePill.x + scorePill.w / 2, scorePill.y + 4, {
        size: 30,
        color: COLORS.text,
        shadow: null,
        align: 'center',
        weight: '900',
      });
    }
  }

  drawStartOverlay(ctx) {
    const audioState = this.audio.getState();
    const rect = this.layout.startPanel;
    const meterRect = {
      x: rect.x + 18,
      y: rect.y + 118,
      w: rect.w - 36,
      h: 52,
    };

    drawRoundedPanel(ctx, rect, {
      fill: 'rgba(15,23,42,0.94)',
      border: COLORS.orange,
      radius: 22,
      glow: COLORS.orange,
      glowAlpha: 0.12,
      lineWidth: 2,
    });

    drawPixelText(ctx, '尖叫小鸟', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.orange,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, '提示：中等音量悬停，大声才上升', SCREEN.width / 2, rect.y + 72, {
      size: 15,
      color: COLORS.textMuted,
      shadow: null,
      align: 'center',
      maxWidth: rect.w - 36,
    });
    drawPixelText(ctx, `无限挑战 / 历史最高 ${this.highScore}`, SCREEN.width / 2, rect.y + 100, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });

    drawMeter(ctx, meterRect, audioState.level, {
      color: audioState.level > 50 ? COLORS.orange : COLORS.green,
      label: audioState.isRecording ? 'LIVE VOICE ENERGY' : 'PREVIEW VOICE ENERGY',
    });

    if (audioState.error) {
      drawPixelText(ctx, audioState.error, meterRect.x + 10, meterRect.y + meterRect.h + 6, {
        size: 11,
        color: COLORS.yellow,
        shadow: null,
        weight: '700',
        maxWidth: meterRect.w - 20,
      });
    }

    drawButton(ctx, this.layout.startButton, '开始挑战', {
      color: COLORS.orange,
      pressed: this.pressedId === 'START',
    });
  }

  drawGameOverOverlay(ctx) {
    const rect = this.layout.gameOverPanel;
    drawRoundedPanel(ctx, rect, {
      fill: 'rgba(15,23,42,0.95)',
      border: COLORS.red,
      radius: 22,
      glow: COLORS.red,
      glowAlpha: 0.1,
      lineWidth: 2,
    });

    drawPixelText(ctx, '游戏结束', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.red,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `${this.finalScore}`, SCREEN.width / 2, rect.y + 74, {
      size: 56,
      color: COLORS.orange,
      shadow: COLORS.shadow,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `历史最高 ${this.highScore}`, SCREEN.width / 2, rect.y + 140, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });
    drawButton(ctx, this.layout.restartButton, '再来一局', {
      color: COLORS.orange,
      pressed: this.pressedId === 'RESTART',
    });
    drawButton(ctx, this.layout.menuButton, '返回大厅', {
      color: COLORS.panelLight,
      textColor: COLORS.text,
      pressed: this.pressedId === 'MENU',
    });
  }

  handleTouchStart(touch) {
    const x = touch.clientX;
    const y = touch.clientY;

    if (this.historyOverlay.handleTouchStart(touch)) {
      return;
    }

    if (this.settingsOverlay.handleTouchStart(touch)) {
      return;
    }

    if (hitTest(this.layout.backButton, x, y)) {
      this.press('BACK');
      return;
    }

    if (this.phase === PHASE.START && hitTest(this.layout.startButton, x, y)) {
      this.press('START');
      return;
    }

    if (this.phase === PHASE.GAMEOVER) {
      if (hitTest(this.layout.restartButton, x, y)) {
        this.press('RESTART');
        return;
      }

      if (hitTest(this.layout.menuButton, x, y)) {
        this.press('MENU');
      }
    }
  }

  handleTouchEnd(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const pressedId = this.pressedId;
    this.pressedTimer = 0.12;

    if (this.historyOverlay.handleTouchEnd(touch)) {
      return;
    }

    if (this.settingsOverlay.handleTouchEnd(touch)) {
      return;
    }

    if (pressedId === 'BACK' && hitTest(this.layout.backButton, x, y)) {
      this.goToMenu();
      return;
    }

    if (pressedId === 'START' && hitTest(this.layout.startButton, x, y)) {
      this.startGame();
      return;
    }

    if (pressedId === 'RESTART' && hitTest(this.layout.restartButton, x, y)) {
      this.startGame();
      return;
    }

    if (pressedId === 'MENU' && hitTest(this.layout.menuButton, x, y)) {
      this.goToMenu();
    }
  }

  press(id) {
    this.pressedId = id;
    this.pressedTimer = 0;
  }
}
