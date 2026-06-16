import { COLORS, GAME_MODES, SCREEN } from '../core/constants.js';
import { drawGameIcon, drawPixelMic } from '../assets/pixel-sprites.js';
import {
  drawButton,
  drawMeter,
  drawPanel,
  drawPixelText,
  drawWrappedText,
  hitTest,
} from '../ui/pixel-ui.js';

const FEATURED = GAME_MODES[0];
const SECONDARY_GAMES = GAME_MODES.slice(1);

export default class MenuScene {
  constructor(options) {
    this.audio = options.audio;
    this.goToGame = options.goToGame;
    this.toast = '';
    this.toastTimer = 0;
    this.pressedId = '';
    this.pressedTimer = 0;
    this.time = 0;
    this.layout = {};
  }

  onEnter() {
    this.computeLayout();
  }

  computeLayout() {
    const w = SCREEN.width;
    const h = SCREEN.height;
    const top = Math.max(18, SCREEN.safeTop + 12);
    const bottomInset = Math.max(16, SCREEN.safeBottom + 16);
    const margin = 16;
    const contentW = w - margin * 2;
    const compact = h < 700;
    const narrow = w < 360;

    const meterTop = top + (compact ? 86 : 104);
    const meterH = compact ? 58 : 64;
    const featuredTop = meterTop + meterH + (compact ? 16 : 22);
    const featuredH = Math.max(150, Math.min(compact ? 168 : 200, h * 0.26));
    const sectionTop = featuredTop + featuredH + (compact ? 18 : 24);
    const gap = 10;
    const cardW = (contentW - gap) / 2;
    const availableCardH = h - sectionTop - bottomInset - 34;
    const cardH = Math.max(78, Math.min(compact ? 92 : 106, (availableCardH - gap) / 2));

    this.layout = {
      margin,
      contentW,
      top,
      compact,
      narrow,
      titleY: top,
      meter: { x: margin, y: meterTop, w: contentW, h: meterH },
      micButton: {
        x: w - margin - (narrow ? 118 : 138),
        y: top + 2,
        w: narrow ? 118 : 138,
        h: 46,
      },
      featured: {
        x: margin,
        y: featuredTop,
        w: contentW,
        h: featuredH,
      },
      featuredButton: {
        x: margin + 18,
        y: featuredTop + featuredH - 58,
        w: Math.min(170, contentW - 36),
        h: 44,
      },
      sectionTitleY: sectionTop,
      cards: SECONDARY_GAMES.map((game, index) => ({
        id: game.id,
        game,
        x: margin + (index % 2) * (cardW + gap),
        y: sectionTop + 32 + Math.floor(index / 2) * (cardH + gap),
        w: cardW,
        h: cardH,
      })),
    };
  }

  update(frame) {
    this.time = frame.time;

    if (this.toastTimer > 0) {
      this.toastTimer -= frame.delta;
      if (this.toastTimer <= 0) {
        this.toast = '';
      }
    }

    if (this.pressedTimer > 0) {
      this.pressedTimer -= frame.delta;
      if (this.pressedTimer <= 0) {
        this.pressedId = '';
      }
    }
  }

  render(ctx) {
    const audioState = this.audio.getState();

    this.drawBackground(ctx);
    this.drawHeader(ctx, audioState);
    this.drawFeatured(ctx);
    this.drawGameGrid(ctx);

    if (this.toast) {
      this.drawToast(ctx);
    }
  }

  drawBackground(ctx) {
    ctx.fillStyle = COLORS.bgDeep;
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    ctx.fillStyle = '#0B1220';
    const grid = 28;
    for (let y = Math.round((this.time * 20) % grid) - grid; y < SCREEN.height; y += grid) {
      ctx.fillRect(0, y, SCREEN.width, 1);
    }
    for (let x = 0; x < SCREEN.width; x += grid) {
      ctx.fillRect(x, 0, 1, SCREEN.height);
    }

    const scanY = Math.round((this.time * 70) % SCREEN.height);
    ctx.fillStyle = 'rgba(34,211,238,0.08)';
    ctx.fillRect(0, scanY, SCREEN.width, 8);
  }

  drawHeader(ctx, audioState) {
    const { titleY, micButton, meter, compact, narrow } = this.layout;
    const titleSize = narrow ? 30 : compact ? 32 : 38;
    const micLabel = audioState.isRecording ? '已开启' : narrow ? '开麦' : '开麦';

    drawPixelText(ctx, '输出全靠吼', this.layout.margin, titleY, {
      size: titleSize,
      color: COLORS.text,
      shadow: COLORS.orange,
      weight: '900',
    });
    drawPixelText(ctx, 'VOICE ARCADE', this.layout.margin + 2, titleY + titleSize + 4, {
      size: 13,
      color: COLORS.cyan,
      shadow: null,
      weight: '700',
    });

    drawButton(ctx, micButton, micLabel, {
      color: audioState.isRecording ? COLORS.green : COLORS.orange,
      pressed: this.pressedId === 'MIC',
    });
    drawPixelMic(ctx, micButton.x + 10, micButton.y + 10 + (this.pressedId === 'MIC' ? 2 : 0), 24, COLORS.bgDeep);

    drawMeter(ctx, meter, audioState.level, {
      color: audioState.level > 65 ? COLORS.red : audioState.level > 35 ? COLORS.orange : COLORS.green,
      label: audioState.isRecording ? 'LIVE VOICE ENERGY' : 'PREVIEW VOICE ENERGY',
    });

    if (audioState.error) {
      drawPixelText(ctx, audioState.error, meter.x + 10, meter.y + meter.h + 6, {
        size: 11,
        color: COLORS.yellow,
        shadow: null,
        weight: '700',
      });
    }
  }

  drawFeatured(ctx) {
    const rect = this.layout.featured;
    const button = this.layout.featuredButton;
    const pressed = this.pressedId === FEATURED.id || this.pressedId === 'FEATURED';

    drawPanel(ctx, rect, {
      fill: COLORS.panel,
      border: FEATURED.accent,
      shadowOffset: 6,
    });

    const iconSize = Math.min(rect.h * 0.58, 120);
    const iconX = rect.x + rect.w - iconSize - 18;
    const iconY = rect.y + rect.h / 2 - iconSize / 2 + Math.sin(this.time * 5) * 3;

    drawPixelText(ctx, '今日开吼', rect.x + 18, rect.y + 16, {
      size: 13,
      color: COLORS.yellow,
      shadow: null,
    });
    drawPixelText(ctx, FEATURED.title, rect.x + 18, rect.y + 40, {
      size: this.layout.compact ? 26 : 30,
      color: COLORS.text,
      shadow: FEATURED.accent,
      weight: '900',
    });
    drawWrappedText(ctx, FEATURED.description, rect.x + 18, rect.y + 78, rect.w - iconSize - 52, 20, {
      size: 15,
      color: COLORS.textMuted,
      weight: '700',
    });

    this.drawSoundBursts(ctx, iconX - 16, iconY + iconSize * 0.45, FEATURED.accent);
    drawGameIcon(ctx, FEATURED.id, iconX, iconY, iconSize, FEATURED.accent);

    drawButton(ctx, button, '开始挑战', {
      color: FEATURED.accent,
      pressed,
    });
  }

  drawSoundBursts(ctx, x, y, color) {
    const pulse = 1 + Math.sin(this.time * 8) * 0.25;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x, y - 18 * pulse, 8, 8);
    ctx.fillRect(x - 14, y - 4, 10, 10);
    ctx.fillRect(x, y + 12 * pulse, 6, 6);
    ctx.globalAlpha = 1;
  }

  drawGameGrid(ctx) {
    drawPixelText(ctx, '选择玩法', this.layout.margin, this.layout.sectionTitleY, {
      size: 18,
      color: COLORS.text,
      shadow: COLORS.shadow,
      weight: '900',
    });

    this.layout.cards.forEach((card) => {
      this.drawGameCard(ctx, card);
    });
  }

  drawGameCard(ctx, card) {
    const pressed = this.pressedId === card.id;
    const y = card.y + (pressed ? 2 : 0);
    const iconSize = Math.min(48, card.h - 30);

    drawPanel(ctx, {
      x: card.x,
      y,
      w: card.w,
      h: card.h,
    }, {
      fill: COLORS.panelDark,
      border: card.game.accent,
      shadowOffset: pressed ? 2 : 4,
    });

    drawGameIcon(ctx, card.game.id, card.x + 10, y + 14, iconSize, card.game.accent);
    drawPixelText(ctx, card.game.shortTitle, card.x + iconSize + 22, y + 14, {
      size: 18,
      color: COLORS.text,
      shadow: card.game.accent,
      weight: '900',
    });
    drawPixelText(ctx, card.game.description, card.x + iconSize + 22, y + 42, {
      size: 12,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
  }

  drawToast(ctx) {
    const w = Math.min(SCREEN.width - 32, 320);
    const h = 52;
    const rect = {
      x: (SCREEN.width - w) / 2,
      y: SCREEN.height - Math.max(92, SCREEN.safeBottom + 76),
      w,
      h,
    };

    drawPanel(ctx, rect, {
      fill: COLORS.panel,
      border: COLORS.yellow,
      shadowOffset: 4,
    });
    drawPixelText(ctx, this.toast, rect.x + rect.w / 2, rect.y + 17, {
      size: 14,
      color: COLORS.text,
      shadow: null,
      align: 'center',
    });
  }

  handleTouchStart(touch) {
    const x = touch.clientX;
    const y = touch.clientY;

    if (hitTest(this.layout.micButton, x, y)) {
      this.press('MIC');
      return;
    }

    if (hitTest(this.layout.featured, x, y)) {
      this.press(FEATURED.id);
      return;
    }

    const card = this.layout.cards.find((item) => hitTest(item, x, y));
    if (card) {
      this.press(card.id);
    }
  }

  handleTouchEnd(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const pressedId = this.pressedId;

    this.pressedTimer = 0.12;

    if (pressedId === 'MIC' && hitTest(this.layout.micButton, x, y)) {
      this.audio.start();
      this.showToast('正在开启麦克风');
      return;
    }

    if (pressedId === FEATURED.id && hitTest(this.layout.featured, x, y)) {
      this.goToGame(FEATURED.id);
      return;
    }

    const card = this.layout.cards.find((item) => pressedId === item.id && hitTest(item, x, y));
    if (card) {
      if (card.id === 'MAGE') {
        this.showToast(`${card.game.shortTitle}玩法迁移中`);
        return;
      }

      this.goToGame(card.id);
    }
  }

  press(id) {
    this.pressedId = id;
    this.pressedTimer = 0;
  }

  showToast(message) {
    this.toast = message;
    this.toastTimer = 1.8;
  }
}
