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
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
};

const STORAGE_KEY = 'shoutex.highScore.sprint';

export default class SprintGameScene {
  constructor(options) {
    this.audio = options.audio;
    this.goToMenu = options.goToMenu;
    this.phase = PHASE.START;
    this.time = 0;
    this.timeLeft = 10;
    this.distance = 0;
    this.speed = 0;
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
    this.timeLeft = 10;
    this.distance = 0;
    this.speed = 0;
  }

  startGame() {
    this.resetRun();
    this.phase = PHASE.PLAYING;
  }

  update(frame) {
    this.time = frame.time;

    if (this.pressedTimer > 0) {
      this.pressedTimer -= frame.delta;
      if (this.pressedTimer <= 0) this.pressedId = '';
    }

    if (this.phase === PHASE.PLAYING) {
      this.updatePlaying(frame.delta);
    }
  }

  updatePlaying(dt) {
    const level = this.audio.getState().level;
    let targetSpeed = 0;
    if (level > 15) {
      targetSpeed = 10 + (level - 15) * 1.5;
    }

    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 8);
    this.distance += this.speed * dt * 5;
    this.timeLeft = Math.max(0, this.timeLeft - dt);

    if (this.timeLeft <= 0) {
      this.phase = PHASE.GAMEOVER;
      this.distance = Math.floor(this.distance);
      this.highScore = setHighScore(STORAGE_KEY, this.distance);
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
    ctx.fillStyle = COLORS.bgDeep;
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    this.drawRoad(ctx);
    this.drawCar(ctx);
    this.drawHud(ctx);
  }

  drawRoad(ctx) {
    const roadY = SCREEN.height * 0.64;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, roadY, SCREEN.width, SCREEN.height - roadY);

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, roadY, SCREEN.width, 5);

    const offset = (this.distance * 2) % 80;
    ctx.fillStyle = COLORS.cyan;
    for (let x = -offset; x < SCREEN.width; x += 80) {
      ctx.fillRect(x, roadY + 58, 42, 6);
    }

    ctx.fillStyle = 'rgba(34,211,238,0.12)';
    for (let i = 0; i < 8; i += 1) {
      const x = ((i * 80) - ((this.distance * 0.9) % 80));
      ctx.fillRect(x, roadY - 90 - (i % 2) * 28, 34, 8);
    }
  }

  drawCar(ctx) {
    const carSize = 72;
    const bounce = this.phase === PHASE.PLAYING ? Math.sin(this.time * 18) * Math.min(4, this.speed / 18) : 0;
    const x = SCREEN.width * 0.28 - carSize / 2;
    const y = SCREEN.height * 0.64 - carSize * 0.66 + bounce;

    if (this.speed > 45) {
      ctx.fillStyle = 'rgba(34,211,238,0.55)';
      ctx.fillRect(x - 58, y + carSize * 0.48, 46, 5);
      ctx.fillRect(x - 38, y + carSize * 0.62, 28, 4);
    }

    drawGameIcon(ctx, 'SPRINT', x, y, carSize, COLORS.cyan);
  }

  drawHud(ctx) {
    drawButton(ctx, this.layout.backButton, '返回', {
      color: COLORS.panel,
      textColor: COLORS.text,
      pressed: this.pressedId === 'BACK',
    });

    if (this.phase === PHASE.PLAYING) {
      drawPixelText(ctx, `${Math.ceil(this.timeLeft)}s`, this.layout.margin, this.layout.top + 62, {
        size: 42,
        color: this.timeLeft <= 3 ? COLORS.red : COLORS.text,
        shadow: COLORS.shadow,
        weight: '900',
      });
      drawPixelText(ctx, `${Math.floor(this.distance)}m`, SCREEN.width - this.layout.margin, this.layout.top + 66, {
        size: 32,
        color: COLORS.cyan,
        shadow: COLORS.shadow,
        align: 'right',
        weight: '900',
      });

      const bar = {
        x: this.layout.margin,
        y: SCREEN.height - Math.max(76, SCREEN.safeBottom + 62),
        w: SCREEN.width - this.layout.margin * 2,
        h: 16,
      };
      ctx.fillStyle = COLORS.panelDark;
      ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
      ctx.fillStyle = COLORS.cyan;
      ctx.fillRect(bar.x, bar.y, bar.w * Math.min(1, this.speed / 100), bar.h);
    } else {
      const audioState = this.audio.getState();
      drawMeter(ctx, this.layout.meter, audioState.level, {
        color: COLORS.cyan,
        label: audioState.isRecording ? 'LIVE VOICE ENERGY' : 'PREVIEW VOICE ENERGY',
      });
    }
  }

  drawStartOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.3, w: SCREEN.width - 40, h: 232 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.cyan, shadowOffset: 6 });
    drawPixelText(ctx, '十秒狂飙', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.cyan,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, '10秒内持续输出，跑出最远距离', SCREEN.width / 2, rect.y + 74, {
      size: 15,
      color: COLORS.textMuted,
      shadow: null,
      align: 'center',
    });
    drawPixelText(ctx, `历史最远 ${this.highScore}m`, SCREEN.width / 2, rect.y + 104, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });
    drawButton(ctx, this.layout.startButton, '开始冲刺', {
      color: COLORS.cyan,
      pressed: this.pressedId === 'START',
    });
  }

  drawGameOverOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.28, w: SCREEN.width - 40, h: 250 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.cyan, shadowOffset: 6 });
    drawPixelText(ctx, '时间到', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.cyan,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `${Math.floor(this.distance)}m`, SCREEN.width / 2, rect.y + 76, {
      size: 52,
      color: COLORS.cyan,
      shadow: COLORS.shadow,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `历史最远 ${this.highScore}m`, SCREEN.width / 2, rect.y + 142, {
      size: 16,
      color: COLORS.yellow,
      shadow: null,
      align: 'center',
      weight: '900',
    });
    drawButton(ctx, this.layout.restartButton, '再跑一次', {
      color: COLORS.cyan,
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
