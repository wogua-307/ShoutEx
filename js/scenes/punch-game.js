import { COLORS, SCREEN } from '../core/constants.js';
import {
  drawBackIconButton,
  drawButton,
  drawMeter,
  drawPanel,
  drawPixelText,
  hitTest,
} from '../ui/pixel-ui.js';
import GameSettingsOverlay from '../ui/game-settings-overlay.js';
import HistoryOverlay from '../ui/history-overlay.js';
import { addGameHistory, getGameHistory } from '../core/game-history.js';
import { getHighScore, setHighScore } from '../core/storage.js';

const PHASE = {
  START: 'START',
  CHARGING: 'CHARGING',
  ANIMATING: 'ANIMATING',
  GAMEOVER: 'GAMEOVER',
};

const STORAGE_KEY = 'shoutex.highScore.punch';

export default class PunchGameScene {
  constructor(options) {
    this.audio = options.audio;
    this.settings = options.settings;
    this.music = options.music;
    this.goToMenu = options.goToMenu;
    this.settingsOverlay = new GameSettingsOverlay(this.settings, this.music);
    this.historyOverlay = new HistoryOverlay({
      title: '分贝发泄馆',
      accent: COLORS.blue,
      getHistory: () => this.history,
    });
    this.phase = PHASE.START;
    this.time = 0;
    this.timeLeft = 5;
    this.peak = 0;
    this.sum = 0;
    this.frames = 0;
    this.damage = 0;
    this.highScore = 0;
    this.history = [];
    this.animTime = 0;
    this.targetOffset = 0;
    this.beamWidth = 0;
    this.pressedId = '';
    this.pressedTimer = 0;
    this.layout = {};
  }

  onEnter() {
    this.highScore = getHighScore(STORAGE_KEY);
    this.history = getGameHistory('PUNCH');
    this.phase = PHASE.START;
    this.computeLayout();
    this.resetRun();
  }

  computeLayout() {
    const margin = 16;
    const top = Math.max(18, SCREEN.safeTop + 12);
    const bottom = SCREEN.height - Math.max(18, SCREEN.safeBottom + 16);

    this.layout = {
      top,
      margin,
      backButton: { x: margin, y: top, w: 48, h: 44 },
      startButton: { x: margin, y: bottom - 58, w: SCREEN.width - margin * 2, h: 48 },
      restartButton: { x: margin, y: bottom - 112, w: SCREEN.width - margin * 2, h: 48 },
      menuButton: { x: margin, y: bottom - 56, w: SCREEN.width - margin * 2, h: 44 },
      meter: { x: margin, y: top + 54, w: SCREEN.width - margin * 2, h: 54 },
    };
    this.historyOverlay.setTopControls(top, margin, 56);
    this.settingsOverlay.setTopControls(top, margin + 56);
  }

  resetRun() {
    this.timeLeft = 5;
    this.peak = 0;
    this.sum = 0;
    this.frames = 0;
    this.damage = 0;
    this.animTime = 0;
    this.targetOffset = 0;
    this.beamWidth = 0;
  }

  startGame() {
    this.resetRun();
    this.phase = PHASE.CHARGING;
  }

  update(frame) {
    this.time = frame.time;

    if (this.pressedTimer > 0) {
      this.pressedTimer -= frame.delta;
      if (this.pressedTimer <= 0) this.pressedId = '';
    }

    if (this.phase === PHASE.CHARGING) {
      this.updateCharging(frame.delta);
    } else if (this.phase === PHASE.ANIMATING) {
      this.updateAnimating(frame.delta);
    }
  }

  updateCharging(dt) {
    const level = this.audio.getState().level;
    this.peak = Math.max(this.peak, level);
    this.sum += level;
    this.frames += 1;
    this.timeLeft = Math.max(0, this.timeLeft - dt);

    if (this.timeLeft <= 0) {
      const average = this.frames > 0 ? this.sum / this.frames : 0;
      this.damage = Math.floor(this.peak * 100 + average * 150);
      this.highScore = setHighScore(STORAGE_KEY, this.damage);
      this.history = addGameHistory('PUNCH', `伤害 ${this.damage}`);
      this.phase = PHASE.ANIMATING;
    }
  }

  updateAnimating(dt) {
    this.animTime += dt;

    if (this.animTime < 0.45) {
      this.beamWidth = (this.animTime / 0.45) * SCREEN.width;
    } else {
      const force = this.damage > 8000 ? 520 : 320;
      this.targetOffset += force * dt;
    }

    if (this.animTime > 1.8) {
      this.phase = PHASE.GAMEOVER;
    }
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
    ctx.fillStyle = COLORS.bgDeep;
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    const level = this.phase === PHASE.CHARGING ? this.audio.getState().level : 0;
    if (level > 20 || this.phase === PHASE.ANIMATING) {
      ctx.fillStyle = `rgba(59,130,246,${Math.min(0.32, level / 260)})`;
      ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
    }

    this.drawArena(ctx);
    this.drawBeam(ctx);
    this.drawTarget(ctx);
    this.drawHud(ctx);
  }

  drawArena(ctx) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, SCREEN.height * 0.68, SCREEN.width, SCREEN.height * 0.32);
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, SCREEN.height * 0.68, SCREEN.width, 5);

    ctx.fillStyle = 'rgba(59,130,246,0.18)';
    for (let x = 0; x < SCREEN.width; x += 42) {
      ctx.fillRect(x, SCREEN.height * 0.68, 2, SCREEN.height * 0.32);
    }
  }

  drawBeam(ctx) {
    if (this.phase !== PHASE.ANIMATING) {
      return;
    }

    const y = SCREEN.height * 0.47;
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(0, y - 28, this.beamWidth, 56);
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillRect(0, y - 10, this.beamWidth, 20);
  }

  drawTarget(ctx) {
    const level = this.audio.getState().level;
    const shake = this.phase === PHASE.CHARGING && level > 30 ? (Math.random() - 0.5) * (level / 4) : 0;
    const w = 92;
    const h = 132;
    const x = SCREEN.width * 0.5 - w / 2 + this.targetOffset;
    const y = SCREEN.height * 0.45 - h / 2 + shake;

    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + w - 18, y, 18, h);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = COLORS.bgDeep;
    ctx.fillRect(x + 25, y + 34, 14, 5);
    ctx.fillRect(x + 54, y + 34, 14, 5);
    ctx.fillRect(x + 32, y + 76, 30, 6);

    if (level > 70 || this.phase === PHASE.ANIMATING) {
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 26, y + 18);
      ctx.lineTo(x + 42, y + 42);
      ctx.lineTo(x + 34, y + 66);
      ctx.moveTo(x + 68, y + 20);
      ctx.lineTo(x + 52, y + 50);
      ctx.lineTo(x + 72, y + 78);
      ctx.stroke();
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

    if (this.phase === PHASE.CHARGING) {
      drawPixelText(ctx, `${this.timeLeft.toFixed(1)}s`, SCREEN.width / 2, this.layout.top + 70, {
        size: 52,
        color: this.timeLeft < 1.6 ? COLORS.red : COLORS.text,
        shadow: COLORS.blue,
        align: 'center',
        weight: '900',
      });
      drawMeter(ctx, this.layout.meter, this.audio.getState().level, {
        color: COLORS.blue,
        label: `PEAK ${Math.round(this.peak)}%`,
      });
    } else if (this.phase !== PHASE.ANIMATING) {
      drawMeter(ctx, this.layout.meter, this.audio.getState().level, {
        color: COLORS.blue,
        label: this.audio.getState().isRecording ? 'LIVE VOICE ENERGY' : 'PREVIEW VOICE ENERGY',
      });
    }
  }

  drawStartOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.28, w: SCREEN.width - 40, h: 262 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.blue, shadowOffset: 6 });
    drawPixelText(ctx, '分贝发泄馆', SCREEN.width / 2, rect.y + 24, {
      size: 31,
      color: COLORS.text,
      shadow: COLORS.blue,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, '提示：5秒内持续大喊，峰值和平均声量都会加伤害', SCREEN.width / 2, rect.y + 74, {
      size: 15,
      color: COLORS.textMuted,
      shadow: null,
      align: 'center',
      maxWidth: rect.w - 36,
    });
    drawPixelText(ctx, `历史最高 ${this.highScore}`, SCREEN.width / 2, rect.y + 104, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });
    drawButton(ctx, this.layout.startButton, '准备发泄', {
      color: COLORS.blue,
      pressed: this.pressedId === 'START',
    });
  }

  drawGameOverOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.25, w: SCREEN.width - 40, h: 280 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.blue, shadowOffset: 6 });
    drawPixelText(ctx, '绝杀成功', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.blue,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `${this.damage}`, SCREEN.width / 2, rect.y + 76, {
      size: 48,
      color: COLORS.blue,
      shadow: COLORS.shadow,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `历史最高 ${this.highScore}`, SCREEN.width / 2, rect.y + 142, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });
    drawButton(ctx, this.layout.restartButton, '再次发泄', {
      color: COLORS.blue,
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
