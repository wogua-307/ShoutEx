import { COLORS, SCREEN } from '../core/constants.js';
import { drawGameIcon } from '../assets/pixel-sprites.js';
import {
  drawButton,
  drawMeter,
  drawPanel,
  drawPixelText,
  hitTest,
} from '../ui/pixel-ui.js';
import { getHighScore, setHighScore } from '../core/storage.js';

const PHASE = {
  START: 'START',
  CHARGING: 'CHARGING',
  FLYING: 'FLYING',
  GAMEOVER: 'GAMEOVER',
};

const STORAGE_KEY = 'shoutex.highScore.rocket';

export default class RocketGameScene {
  constructor(options) {
    this.audio = options.audio;
    this.goToMenu = options.goToMenu;
    this.phase = PHASE.START;
    this.time = 0;
    this.chargeLeft = 3;
    this.maxVolume = 0;
    this.altitude = 0;
    this.velocity = 0;
    this.highScore = 0;
    this.pressedId = '';
    this.pressedTimer = 0;
    this.layout = {};
  }

  onEnter() {
    this.highScore = getHighScore(STORAGE_KEY);
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
      backButton: { x: margin, y: top, w: 94, h: 44 },
      startButton: { x: margin, y: bottom - 58, w: SCREEN.width - margin * 2, h: 48 },
      restartButton: { x: margin, y: bottom - 112, w: SCREEN.width - margin * 2, h: 48 },
      menuButton: { x: margin, y: bottom - 56, w: SCREEN.width - margin * 2, h: 44 },
      meter: { x: margin, y: top + 54, w: SCREEN.width - margin * 2, h: 54 },
    };
  }

  resetRun() {
    this.chargeLeft = 3;
    this.maxVolume = 0;
    this.altitude = 0;
    this.velocity = 0;
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
    } else if (this.phase === PHASE.FLYING) {
      this.updateFlying(frame.delta);
    }
  }

  updateCharging(dt) {
    const level = this.audio.getState().level;
    this.maxVolume = Math.max(this.maxVolume, level);
    this.chargeLeft = Math.max(0, this.chargeLeft - dt);

    if (this.chargeLeft <= 0) {
      this.velocity = Math.pow(Math.max(1, this.maxVolume), 1.3) * 2;
      this.phase = PHASE.FLYING;
    }
  }

  updateFlying(dt) {
    this.velocity -= 90 * dt;
    this.altitude += Math.max(0, this.velocity) * dt;

    if (this.velocity <= 0) {
      this.altitude = Math.floor(this.altitude);
      this.highScore = setHighScore(STORAGE_KEY, this.altitude);
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
  }

  drawWorld(ctx) {
    const gradient = ctx.createLinearGradient ? ctx.createLinearGradient(0, 0, 0, SCREEN.height) : null;
    if (gradient) {
      gradient.addColorStop(0, '#1E1B4B');
      gradient.addColorStop(0.52, '#581C87');
      gradient.addColorStop(1, '#070B14');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = '#1E1B4B';
    }
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    this.drawStars(ctx);
    this.drawGround(ctx);
    this.drawRocket(ctx);
    this.drawHud(ctx);
  }

  drawStars(ctx) {
    const speed = this.phase === PHASE.FLYING ? 180 : 28;
    const offset = (this.time * speed) % 80;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 24; i += 1) {
      const x = (i * 47) % SCREEN.width;
      const y = (i * 73 + offset) % SCREEN.height;
      ctx.fillRect(x, y, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
  }

  drawGround(ctx) {
    if (this.phase === PHASE.FLYING) {
      return;
    }

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, SCREEN.height - 80, SCREEN.width, 80);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, SCREEN.height - 82, SCREEN.width, 4);
  }

  drawRocket(ctx) {
    const size = 76;
    const x = SCREEN.width / 2 - size / 2;
    const baseY = SCREEN.height - 156;
    const flightOffset = this.phase === PHASE.FLYING ? Math.min(SCREEN.height * 0.42, this.altitude * 0.55) : 0;
    const shake = this.phase === PHASE.CHARGING ? (Math.random() - 0.5) * (this.audio.getState().level / 10) : 0;
    const y = baseY - flightOffset + shake;

    drawGameIcon(ctx, 'ROCKET', x, y, size, COLORS.rose);

    const flameLevel = this.phase === PHASE.FLYING ? 80 : this.audio.getState().level;
    if (flameLevel > 12) {
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(x + size * 0.43, y + size * 0.88, size * 0.14, Math.min(70, flameLevel));
      ctx.fillStyle = COLORS.orange;
      ctx.fillRect(x + size * 0.38, y + size * 0.94, size * 0.24, Math.min(48, flameLevel * 0.7));
    }
  }

  drawHud(ctx) {
    drawButton(ctx, this.layout.backButton, '返回', {
      color: COLORS.panel,
      textColor: COLORS.text,
      pressed: this.pressedId === 'BACK',
    });

    if (this.phase === PHASE.CHARGING) {
      drawPixelText(ctx, this.chargeLeft.toFixed(1), SCREEN.width / 2, this.layout.top + 84, {
        size: 64,
        color: COLORS.text,
        shadow: COLORS.rose,
        align: 'center',
        weight: '900',
      });
      drawMeter(ctx, this.layout.meter, this.audio.getState().level, {
        color: COLORS.rose,
        label: `MAX ${Math.round(this.maxVolume)}%`,
      });
    } else if (this.phase === PHASE.FLYING) {
      drawPixelText(ctx, '当前高度', SCREEN.width / 2, this.layout.top + 66, {
        size: 14,
        color: COLORS.textMuted,
        shadow: null,
        align: 'center',
      });
      drawPixelText(ctx, `${Math.floor(this.altitude)}m`, SCREEN.width / 2, this.layout.top + 88, {
        size: 46,
        color: COLORS.rose,
        shadow: COLORS.shadow,
        align: 'center',
        weight: '900',
      });
    } else {
      drawMeter(ctx, this.layout.meter, this.audio.getState().level, {
        color: COLORS.rose,
        label: this.audio.getState().isRecording ? 'LIVE VOICE ENERGY' : 'PREVIEW VOICE ENERGY',
      });
    }
  }

  drawStartOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.3, w: SCREEN.width - 40, h: 232 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.rose, shadowOffset: 6 });
    drawPixelText(ctx, '声波火箭', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.rose,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, '3秒蓄力，用最高音量发射', SCREEN.width / 2, rect.y + 74, {
      size: 15,
      color: COLORS.textMuted,
      shadow: null,
      align: 'center',
    });
    drawPixelText(ctx, `历史最高 ${this.highScore}m`, SCREEN.width / 2, rect.y + 104, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });
    drawButton(ctx, this.layout.startButton, '准备发射', {
      color: COLORS.rose,
      pressed: this.pressedId === 'START',
    });
  }

  drawGameOverOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.28, w: SCREEN.width - 40, h: 250 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.rose, shadowOffset: 6 });
    drawPixelText(ctx, '到达顶点', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.rose,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `${Math.floor(this.altitude)}m`, SCREEN.width / 2, rect.y + 76, {
      size: 52,
      color: COLORS.rose,
      shadow: COLORS.shadow,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `历史最高 ${this.highScore}m`, SCREEN.width / 2, rect.y + 142, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });
    drawButton(ctx, this.layout.restartButton, '重新发射', {
      color: COLORS.rose,
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
