import { COLORS, SCREEN } from '../core/constants.js';
import { drawGameIcon } from '../assets/pixel-sprites.js';
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
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
};

const STORAGE_KEY = 'shoutex.highScore.mage';

export default class MageGameScene {
  constructor(options) {
    this.audio = options.audio;
    this.settings = options.settings;
    this.music = options.music;
    this.goToMenu = options.goToMenu;
    this.settingsOverlay = new GameSettingsOverlay(this.settings, this.music);
    this.historyOverlay = new HistoryOverlay({
      title: '言出法随小法师',
      accent: COLORS.purple,
      getHistory: () => this.history,
    });
    this.phase = PHASE.START;
    this.time = 0;
    this.baseHp = 100;
    this.score = 0;
    this.highScore = 0;
    this.history = [];
    this.gameTime = 0;
    this.lastFireTime = 0;
    this.spawnTimer = 0;
    this.mageY = 0;
    this.draggingMage = false;
    this.enemies = [];
    this.projectiles = [];
    this.pressedId = '';
    this.pressedTimer = 0;
    this.layout = {};
  }

  onEnter() {
    this.highScore = getHighScore(STORAGE_KEY);
    this.history = getGameHistory('MAGE');
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
      laneTop: top + 120,
      laneBottom: bottom - 92,
      baseWidth: Math.max(70, SCREEN.width * 0.18),
    };
    this.historyOverlay.setTopControls(top, margin, 56);
    this.settingsOverlay.setTopControls(top, margin + 56);
  }

  resetRun() {
    this.baseHp = 100;
    this.score = 0;
    this.gameTime = 0;
    this.lastFireTime = 0;
    this.spawnTimer = 0.8;
    this.mageY = (this.layout.laneTop + this.layout.laneBottom) / 2;
    this.draggingMage = false;
    this.enemies = [];
    this.projectiles = [];
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
    this.gameTime += dt;
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(0.56, 1.85 - this.gameTime * 0.035);
    }

    this.tryFire();
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.resolveCollisions();

    if (this.baseHp <= 0) {
      this.baseHp = 0;
      this.phase = PHASE.GAMEOVER;
      this.highScore = setHighScore(STORAGE_KEY, this.score);
      this.history = addGameHistory('MAGE', `得分 ${this.score}`);
    }
  }

  spawnEnemy() {
    const laneTop = this.layout.laneTop + 36;
    const laneBottom = this.layout.laneBottom - 30;
    const y = laneTop + Math.random() * Math.max(40, laneBottom - laneTop);
    const maxHp = 24 + Math.floor(this.gameTime * 2.2);

    this.enemies.push({
      x: SCREEN.width + 24,
      y,
      hp: maxHp,
      maxHp,
      size: 34,
      speed: 34 + Math.min(28, this.gameTime * 0.9),
    });
  }

  tryFire() {
    const level = this.audio.getState().level;
    const now = this.gameTime;

    if (level <= 10 || now - this.lastFireTime < 0.28) {
      return;
    }

    let type = 'missile';
    let size = 10;
    let damage = 10;
    let speed = 260;
    let color = COLORS.cyan;

    if (level > 70) {
      type = 'meteor';
      size = 58;
      damage = 170;
      speed = 190;
      color = COLORS.orange;
    } else if (level > 40) {
      type = 'fireball';
      size = 28;
      damage = 48;
      speed = 230;
      color = COLORS.yellow;
    }

    this.projectiles.push({
      type,
      x: this.layout.baseWidth + 8,
      y: this.mageY,
      size,
      damage,
      speed,
      color,
    });
    this.lastFireTime = now;
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      projectile.x += projectile.speed * dt;

      if (projectile.x - projectile.size > SCREEN.width + 40) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateEnemies(dt) {
    const baseLine = this.layout.baseWidth + 6;

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.x -= enemy.speed * dt;

      if (enemy.x - enemy.size / 2 <= baseLine) {
        this.baseHp -= 12;
        this.enemies.splice(i, 1);
      }
    }
  }

  resolveCollisions() {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];

      for (let j = this.projectiles.length - 1; j >= 0; j -= 1) {
        const projectile = this.projectiles[j];
        const dx = enemy.x - projectile.x;
        const dy = enemy.y - projectile.y;
        const radius = enemy.size / 2 + projectile.size / 2;

        if (dx * dx + dy * dy > radius * radius) {
          continue;
        }

        enemy.hp -= projectile.damage;

        if (projectile.type !== 'meteor') {
          this.projectiles.splice(j, 1);
        }

        if (enemy.hp <= 0) {
          this.score += 100;
          this.enemies.splice(i, 1);
        }

        break;
      }
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
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    this.drawGrid(ctx);
    this.drawBase(ctx);
    this.drawProjectiles(ctx);
    this.drawEnemies(ctx);
    this.drawHud(ctx);
  }

  drawGrid(ctx) {
    const { laneTop, laneBottom } = this.layout;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, laneTop, SCREEN.width, laneBottom - laneTop);

    ctx.fillStyle = 'rgba(168,85,247,0.16)';
    for (let x = 0; x < SCREEN.width; x += 34) {
      ctx.fillRect(x, laneTop, 1, laneBottom - laneTop);
    }
    for (let y = laneTop; y < laneBottom; y += 34) {
      ctx.fillRect(0, y, SCREEN.width, 1);
    }
  }

  drawBase(ctx) {
    const { laneTop, laneBottom, baseWidth } = this.layout;
    ctx.fillStyle = '#312E81';
    ctx.fillRect(0, laneTop, baseWidth, laneBottom - laneTop);
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(baseWidth - 10, laneTop, 10, laneBottom - laneTop);
    ctx.strokeStyle = COLORS.purple;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, laneTop, baseWidth, laneBottom - laneTop);

    const mageSize = Math.min(70, baseWidth * 0.9);
    const mageX = baseWidth / 2 - mageSize / 2;
    const mageY = this.mageY - mageSize / 2 + Math.sin(this.time * 5) * 3;
    drawGameIcon(ctx, 'MAGE', mageX, mageY, mageSize, COLORS.purple);

    if (this.phase === PHASE.PLAYING && this.audio.getState().level > 10) {
      ctx.fillStyle = COLORS.cyan;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(baseWidth + 4, mageY + mageSize * 0.45, 10, 10);
      ctx.globalAlpha = 1;
    }

    if (this.phase === PHASE.PLAYING) {
      ctx.fillStyle = 'rgba(168,85,247,0.22)';
      ctx.fillRect(baseWidth + 8, this.mageY - 1, SCREEN.width - baseWidth - 16, 2);
    }
  }

  drawProjectiles(ctx) {
    this.projectiles.forEach((projectile) => {
      ctx.fillStyle = projectile.color;
      ctx.globalAlpha = projectile.type === 'meteor' ? 0.82 : 0.95;
      ctx.fillRect(
        projectile.x - projectile.size / 2,
        projectile.y - projectile.size / 2,
        projectile.size,
        projectile.size
      );
      ctx.globalAlpha = 1;

      if (projectile.type === 'meteor') {
        ctx.fillStyle = 'rgba(239,68,68,0.32)';
        ctx.fillRect(projectile.x - projectile.size, projectile.y - 8, projectile.size * 0.8, 16);
      }
    });
  }

  drawEnemies(ctx) {
    this.enemies.forEach((enemy) => {
      const x = enemy.x - enemy.size / 2;
      const y = enemy.y - enemy.size / 2;

      ctx.fillStyle = COLORS.bgDeep;
      ctx.fillRect(x, y - 9, enemy.size, 4);
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(x, y - 9, enemy.size * Math.max(0, enemy.hp / enemy.maxHp), 4);

      ctx.fillStyle = '#10B981';
      ctx.fillRect(x + 4, y + 8, enemy.size - 8, enemy.size - 8);
      ctx.fillRect(x + 10, y + 2, enemy.size - 20, 10);
      ctx.fillStyle = '#A7F3D0';
      ctx.fillRect(x + 11, y + 13, 5, 5);
      ctx.fillRect(x + enemy.size - 16, y + 13, 5, 5);
    });
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
      drawPixelText(ctx, `${this.score}`, SCREEN.width - this.layout.margin, this.layout.top + 8, {
        size: 30,
        color: COLORS.yellow,
        shadow: COLORS.shadow,
        align: 'right',
        weight: '900',
      });
      this.drawHpBar(ctx);
    } else {
      drawMeter(ctx, this.layout.meter, this.audio.getState().level, {
        color: COLORS.purple,
        label: this.audio.getState().isRecording ? 'LIVE VOICE ENERGY' : 'PREVIEW VOICE ENERGY',
      });
    }
  }

  drawHpBar(ctx) {
    const x = this.layout.margin;
    const y = this.layout.top + 58;
    const w = SCREEN.width - this.layout.margin * 2;
    const h = 14;

    ctx.fillStyle = COLORS.panelDark;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = this.baseHp <= 30 ? COLORS.red : COLORS.green;
    ctx.fillRect(x, y, w * Math.max(0, this.baseHp / 100), h);
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  drawStartOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.27, w: SCREEN.width - 40, h: 274 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.purple, shadowOffset: 6 });
    drawPixelText(ctx, '言出法随小法师', SCREEN.width / 2, rect.y + 24, {
      size: 27,
      color: COLORS.text,
      shadow: COLORS.purple,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, '提示：拖动法师瞄准，小声飞弹，中声火球，大声陨石', SCREEN.width / 2, rect.y + 74, {
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
    drawButton(ctx, this.layout.startButton, '开始防守', {
      color: COLORS.purple,
      pressed: this.pressedId === 'START',
    });
  }

  drawGameOverOverlay(ctx) {
    const rect = { x: 20, y: SCREEN.height * 0.25, w: SCREEN.width - 40, h: 280 };
    drawPanel(ctx, rect, { fill: COLORS.panel, border: COLORS.red, shadowOffset: 6 });
    drawPixelText(ctx, '城门失守', SCREEN.width / 2, rect.y + 24, {
      size: 32,
      color: COLORS.text,
      shadow: COLORS.red,
      align: 'center',
      weight: '900',
    });
    drawPixelText(ctx, `${this.score}`, SCREEN.width / 2, rect.y + 76, {
      size: 52,
      color: COLORS.yellow,
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
    drawButton(ctx, this.layout.restartButton, '重新防守', {
      color: COLORS.purple,
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

    if (this.phase === PHASE.PLAYING && this.isMageControlTouch(x, y)) {
      this.draggingMage = true;
      this.setMageY(y);
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

  handleTouchMove(touch) {
    if (this.historyOverlay.open || this.settingsOverlay.open) {
      return;
    }

    if (this.draggingMage && this.phase === PHASE.PLAYING) {
      this.setMageY(touch.clientY);
    }
  }

  handleTouchEnd(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const pressedId = this.pressedId;
    this.pressedTimer = 0.12;
    this.draggingMage = false;

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

  isMageControlTouch(x, y) {
    return x <= Math.max(this.layout.baseWidth + 56, SCREEN.width * 0.34) &&
      y >= this.layout.laneTop &&
      y <= this.layout.laneBottom;
  }

  setMageY(y) {
    const mageSize = Math.min(70, this.layout.baseWidth * 0.9);
    const minY = this.layout.laneTop + mageSize / 2 + 6;
    const maxY = this.layout.laneBottom - mageSize / 2 - 6;
    this.mageY = Math.max(minY, Math.min(maxY, y));
  }
}
