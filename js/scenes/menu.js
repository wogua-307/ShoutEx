import { COLORS, GAME_MODES, SCREEN } from '../core/constants.js';
import { drawGameIcon, drawPixelMic } from '../assets/pixel-sprites.js';
import {
  drawButton,
  drawIconButton,
  drawMeter,
  drawPanel,
  drawPixelFrame,
  drawPixelText,
  hitTest,
} from '../ui/pixel-ui.js';

const FEATURED_GAME = GAME_MODES[0];
const SECONDARY_GAMES = GAME_MODES.slice(1);

export default class MenuScene {
  constructor(options) {
    this.audio = options.audio;
    this.settings = options.settings;
    this.music = options.music;
    this.goToGame = options.goToGame;
    this.toast = '';
    this.toastTimer = 0;
    this.pressedId = '';
    this.pressedTimer = 0;
    this.time = 0;
    this.settingsOpen = false;
    this.scrollY = 0;
    this.scrollMax = 0;
    this.dragStartY = 0;
    this.dragLastY = 0;
    this.dragMoved = false;
    this.layout = {};
  }

  onEnter() {
    this.computeLayout();
  }

  computeLayout() {
    const w = SCREEN.width;
    const h = SCREEN.height;
    const top = Math.max(18, SCREEN.statusBarHeight, SCREEN.safeTop) + 12;
    const bottomInset = Math.max(4, SCREEN.safeBottom + 4);
    const margin = 16;
    const contentW = w - margin * 2;
    const compact = h < 700;
    const tiny = h < 620;
    const narrow = w < 360;
    let titleSize = narrow ? 30 : compact ? 32 : 38;
    const menuButtonLeft = SCREEN.menuButton ? SCREEN.menuButton.left : w;
    const rightSafeLimit = Math.min(w - margin, menuButtonLeft - 10);
    const settingsSize = 44;
    const settingsX = Math.max(margin, rightSafeLimit - settingsSize);
    const settingsButton = {
      x: settingsX,
      y: top,
      w: settingsSize,
      h: settingsSize,
    };
    const titleMaxW = settingsButton.x - margin - 12;
    if (titleMaxW < 250) {
      titleSize = narrow ? 27 : compact ? 29 : 32;
    }

    const titleBottom = top + titleSize + 23;
    const headerBottom = Math.max(titleBottom, settingsButton.y + settingsButton.h);
    const sectionTop = headerBottom + (compact ? 18 : 24);
    const gap = narrow ? 8 : 12;
    const gridTop = sectionTop + 34;
    const featuredH = Math.max(tiny ? 138 : 154, Math.min(tiny ? 150 : compact ? 168 : 184, h * (tiny ? 0.23 : 0.2)));
    const secondaryTop = gridTop + featuredH + gap;
    const cardW = Math.floor((contentW - gap) / 2);
    const cardH = Math.max(tiny ? 154 : 178, Math.min(tiny ? 168 : compact ? 196 : 222, h * (tiny ? 0.27 : compact ? 0.3 : 0.26)));
    const gridBottom = h - bottomInset;
    const gridHeight = Math.max(120, gridBottom - gridTop);
    const secondaryRows = Math.ceil(SECONDARY_GAMES.length / 2);
    const contentHeight = featuredH + gap + secondaryRows * cardH + Math.max(0, secondaryRows - 1) * gap;
    this.scrollMax = Math.max(0, contentHeight - gridHeight);
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.scrollMax));
    const modalW = Math.min(contentW, 340);
    const modalH = compact ? 334 : 358;
    const modalY = Math.max(
      top + 54,
      Math.min(Math.round((h - modalH) / 2), h - bottomInset - modalH)
    );
    const settingsModal = {
      x: Math.round((w - modalW) / 2),
      y: modalY,
      w: modalW,
      h: modalH,
    };

    this.layout = {
      margin,
      contentW,
      top,
      compact,
      tiny,
      narrow,
      titleY: top,
      titleSize,
      settingsButton,
      settingsModal,
      settingsCloseButton: {
        x: settingsModal.x + settingsModal.w - 58,
        y: settingsModal.y + 12,
        w: 44,
        h: 44,
      },
      settingsMicButton: {
        x: settingsModal.x + 18,
        y: settingsModal.y + 76,
        w: Math.min(180, settingsModal.w - 36),
        h: 44,
      },
      settingsMeter: {
        x: settingsModal.x + 18,
        y: settingsModal.y + 224,
        w: settingsModal.w - 36,
        h: compact ? 58 : 64,
      },
      settingsBgmButton: {
        x: settingsModal.x + 18,
        y: settingsModal.y + 158,
        w: settingsModal.w - 36,
        h: 44,
      },
      sectionTitleY: sectionTop,
      gridClip: {
        x: margin,
        y: gridTop,
        w: contentW,
        h: gridHeight,
      },
      featuredCard: {
        id: FEATURED_GAME.id,
        game: FEATURED_GAME,
        x: margin,
        y: gridTop,
        w: contentW,
        h: featuredH,
        featured: true,
      },
      cards: SECONDARY_GAMES.map((game, index) => ({
        id: game.id,
        game,
        x: margin + (index % 2) * (cardW + gap),
        y: secondaryTop + Math.floor(index / 2) * (cardH + gap),
        w: cardW,
        h: cardH,
        featured: false,
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
    this.drawGameGrid(ctx);

    if (this.settingsOpen) {
      this.drawSettingsModal(ctx, audioState);
    }

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
    const { titleY, settingsButton, titleSize } = this.layout;

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

    drawIconButton(ctx, settingsButton, 'settings', {
      color: COLORS.panel,
      iconColor: audioState.isRecording ? COLORS.green : COLORS.text,
      pressed: this.pressedId === 'SETTINGS',
    });
  }

  drawGameGrid(ctx) {
    drawPixelText(ctx, '选择玩法', this.layout.margin, this.layout.sectionTitleY, {
      size: 18,
      color: COLORS.text,
      shadow: COLORS.shadow,
      weight: '900',
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.layout.gridClip.x - 8, this.layout.gridClip.y - 6, this.layout.gridClip.w + 16, this.layout.gridClip.h + 10);
    ctx.clip();

    [this.layout.featuredCard, ...this.layout.cards].forEach((card) => {
      this.drawGameCard(ctx, card);
    });

    ctx.restore();
  }

  drawGameCard(ctx, card) {
    const pressed = this.pressedId === card.id;
    const y = card.y - this.scrollY;
    if (y + card.h < this.layout.gridClip.y - 8 || y > this.layout.gridClip.y + this.layout.gridClip.h + 8) {
      return;
    }

    const rect = {
      x: card.x,
      y: y + (pressed ? 2 : 0),
      w: card.w,
      h: card.h,
    };
    const compact = this.layout.compact || card.w < 164;
    const featured = !!card.featured;
    const pad = compact ? 18 : 22;
    const tag = this.getGameTag(card.game.id);
    const meta = this.getGameMeta(card.game.id);
    const titleSize = featured ? (compact ? 22 : 26) : (compact ? 17 : 20);
    const descSize = featured ? (compact ? 14 : 16) : (compact ? 12 : 14);
    const iconSize = featured ? (compact ? 46 : 56) : (compact ? 28 : 34);

    drawPixelFrame(ctx, rect, {
      fill: pressed ? 'rgba(15,23,42,0.96)' : 'rgba(7,11,20,0.88)',
      border: card.game.accent,
      pressed,
    });

    if (featured) {
      this.drawFeaturedGameCardContent(ctx, rect, card, meta, tag, {
        pad,
        iconSize,
        titleSize,
        descSize,
        compact,
      });
      return;
    }

    const titleY = rect.y + pad + iconSize + (compact ? 22 : 26);
    const descY = titleY + titleSize + 12;
    const footerY = descY + descSize + (compact ? 30 : 32);
    const startY = footerY + (compact ? 22 : 24);

    this.drawAnimatedGameIcon(ctx, card.game.id, rect.x + pad, rect.y + pad + 2, iconSize, card.game.accent, false);
    drawPixelText(ctx, `[ ${tag} ]`, rect.x + rect.w - pad, rect.y + pad + 1, {
      size: compact ? 12 : 13,
      color: COLORS.cyan,
      shadow: null,
      align: 'right',
      weight: '900',
      maxWidth: rect.w - pad * 2 - iconSize - 10,
    });
    drawPixelText(ctx, meta.title, rect.x + pad, titleY, {
      size: titleSize,
      color: COLORS.text,
      shadow: 'rgba(255,255,255,0.22)',
      weight: '900',
      maxWidth: rect.w - pad * 2,
    });
    drawPixelText(ctx, meta.desc, rect.x + pad, descY, {
      size: descSize,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
      maxWidth: rect.w - pad * 2,
    });

    ctx.fillStyle = 'rgba(148,163,184,0.12)';
    ctx.fillRect(rect.x + pad, footerY - 12, rect.w - pad * 2, 2);
    drawPixelText(ctx, '难度:', rect.x + pad, footerY, {
      size: compact ? 12 : 13,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
      maxWidth: 42,
    });
    drawPixelText(ctx, meta.stars, rect.x + pad + (compact ? 42 : 48), footerY, {
      size: compact ? 12 : 13,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
    drawPixelText(ctx, 'START ▷', rect.x + rect.w - pad, startY, {
      size: compact ? 13 : 14,
      color: COLORS.yellow,
      shadow: null,
      align: 'right',
      weight: '900',
    });
  }

  drawFeaturedGameCardContent(ctx, rect, card, meta, tag, metrics) {
    const { pad, iconSize, titleSize, descSize, compact } = metrics;
    const iconX = rect.x + pad;
    const iconY = rect.y + pad + 8;
    const textX = iconX + iconSize + (compact ? 16 : 20);
    const textW = Math.max(80, rect.x + rect.w - textX - pad);
    const titleY = rect.y + pad + 8;
    const descY = titleY + titleSize + 14;
    const footerY = rect.y + rect.h - (compact ? 48 : 54);

    this.drawAnimatedGameIcon(ctx, card.game.id, iconX, iconY, iconSize, card.game.accent, true);
    drawPixelText(ctx, `[ ${tag} ]`, rect.x + rect.w - pad, rect.y + pad + 1, {
      size: compact ? 13 : 14,
      color: COLORS.cyan,
      shadow: null,
      align: 'right',
      weight: '900',
      maxWidth: Math.max(62, textW - 12),
    });
    drawPixelText(ctx, meta.title, textX, titleY, {
      size: titleSize,
      color: COLORS.text,
      shadow: 'rgba(255,255,255,0.22)',
      weight: '900',
      maxWidth: textW,
    });
    drawPixelText(ctx, meta.desc, textX, descY, {
      size: descSize,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
      maxWidth: textW,
    });

    ctx.fillStyle = 'rgba(148,163,184,0.12)';
    ctx.fillRect(rect.x + pad, footerY - 12, rect.w - pad * 2, 2);
    drawPixelText(ctx, '难度:', rect.x + pad, footerY, {
      size: compact ? 12 : 13,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
    drawPixelText(ctx, meta.stars, rect.x + pad + (compact ? 42 : 48), footerY, {
      size: compact ? 12 : 13,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
    drawPixelText(ctx, 'START ▷', rect.x + rect.w - pad, footerY, {
      size: compact ? 13 : 14,
      color: COLORS.yellow,
      shadow: null,
      align: 'right',
      weight: '900',
    });
  }

  drawAnimatedGameIcon(ctx, gameId, x, y, size, color, featured = false) {
    if (!this.isIconAnimated(gameId)) {
      drawGameIcon(ctx, gameId, x, y, size, color);
      return;
    }

    const step = Math.floor(this.time * 8);
    const unit = size / 12;
    let dx = 0;
    let dy = 0;

    if (gameId === 'SCREAM_BIRD') {
      dx = [0, 1, 0, -1][step % 4];
      dy = [0, -2, 0, 2][step % 4];
      this.drawIconPixel(ctx, x + size + unit * 0.7, y + unit * 3.2 + dy, unit * 0.8, COLORS.cyan, 0.65);
      this.drawIconPixel(ctx, x + size + unit * 1.7, y + unit * 5 + dy, unit * 0.65, COLORS.cyan, 0.42);
    } else if (gameId === 'SPRINT') {
      dx = [0, 2, 0, -1][step % 4];
      dy = step % 2;
      this.drawIconPixel(ctx, x - unit * 1.2, y + size * 0.72, unit * 0.8, COLORS.cyan, 0.55);
      this.drawIconPixel(ctx, x - unit * 2.1, y + size * 0.8, unit * 0.55, COLORS.textMuted, 0.4);
    } else if (gameId === 'ROCKET') {
      dy = [2, 0, -2, 0][step % 4];
      this.drawIconPixel(ctx, x + unit * 5.1, y + size + unit * 0.1, unit * 1.4, COLORS.yellow, 0.82);
      this.drawIconPixel(ctx, x + unit * 5.4, y + size + unit * 1.2, unit, COLORS.orange, 0.62);
    } else if (gameId === 'PUNCH') {
      dy = [0, -1, 0, 1][step % 4];
      this.drawIconPixel(ctx, x + size * 0.82, y + unit * 0.8, unit * 0.75, COLORS.blue, 0.58);
      this.drawIconPixel(ctx, x + size * 0.15, y + size * 0.78, unit * 0.65, COLORS.yellow, 0.5);
    } else {
      dy = [0, -1, 0, 1][step % 4];
      this.drawIconPixel(ctx, x + size * 0.82, y + unit * 0.3, unit * 0.8, COLORS.cyan, 0.7);
      this.drawIconPixel(ctx, x + size * 0.94, y + unit * 1.7, unit * 0.55, COLORS.yellow, 0.55);
    }

    drawGameIcon(ctx, gameId, x + dx, y + dy, size + (featured && step % 6 === 0 ? 1 : 0), color);
  }

  isIconAnimated(gameId) {
    const ids = GAME_MODES.map((game) => game.id);
    const windowIndex = Math.floor(this.time / 1.7);
    const seed = (windowIndex * 1103515245 + 12345) >>> 0;
    const first = seed % ids.length;
    const count = (seed >> 8) % 3 === 0 ? 2 : 1;

    if (gameId === ids[first]) {
      return true;
    }

    return count === 2 && gameId === ids[(first + 2 + ((seed >> 16) % (ids.length - 1))) % ids.length];
  }

  drawIconPixel(ctx, x, y, size, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(size)), Math.max(1, Math.round(size)));
    ctx.restore();
  }

  getGameTag(gameId) {
    if (gameId === 'SCREAM_BIRD') return '最热';
    if (gameId === 'SPRINT') return '挑战';
    if (gameId === 'ROCKET') return '冲高';
    if (gameId === 'PUNCH') return '解压';
    return '硬核';
  }

  getGameMeta(gameId) {
    if (gameId === 'SCREAM_BIRD') {
      return { title: '尖叫小鸟', desc: '经典：声能避障飞翔', stars: '★★☆' };
    }
    if (gameId === 'SPRINT') {
      return { title: '赛车狂飙', desc: '竞速：声控极速冲刺', stars: '★★☆' };
    }
    if (gameId === 'ROCKET') {
      return { title: '声波火箭', desc: '冲高：峰值决定高度', stars: '★★☆' };
    }
    if (gameId === 'PUNCH') {
      return { title: '限时发泄馆', desc: '爆破：解压碎裂玻璃', stars: '★★☆' };
    }
    return { title: '声控防守法师', desc: '塔防：吟唱奥术火球', stars: '★★★' };
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

  drawSettingsModal(ctx, audioState) {
    const modal = this.layout.settingsModal;
    const closeButton = this.layout.settingsCloseButton;
    const micButton = this.layout.settingsMicButton;
    const meter = this.layout.settingsMeter;
    const bgmButton = this.layout.settingsBgmButton;
    const micLabel = audioState.isRecording ? '麦克风已开' : '开启麦克风';
    const meterLevel = audioState.isRecording ? audioState.level : 0;
    const bgmEnabled = this.settings.isBgmEnabled();

    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    drawPanel(ctx, modal, {
      fill: COLORS.panel,
      border: COLORS.cyan,
      shadowOffset: 6,
    });

    drawPixelText(ctx, '设置', modal.x + 18, modal.y + 18, {
      size: 24,
      color: COLORS.text,
      shadow: COLORS.cyan,
      weight: '900',
    });
    drawIconButton(ctx, closeButton, 'close', {
      color: COLORS.panelDark,
      iconColor: COLORS.text,
      pressed: this.pressedId === 'SETTINGS_CLOSE',
    });

    drawPixelText(ctx, '声音输入', modal.x + 18, modal.y + 54, {
      size: 13,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });

    drawButton(ctx, micButton, micLabel, {
      color: audioState.isRecording ? COLORS.green : COLORS.orange,
      pressed: this.pressedId === 'SETTINGS_MIC',
    });
    drawPixelMic(ctx, micButton.x + 10, micButton.y + 10 + (this.pressedId === 'SETTINGS_MIC' ? 2 : 0), 24, COLORS.bgDeep);

    drawPixelText(ctx, '背景音乐', modal.x + 18, modal.y + 136, {
      size: 13,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
    drawButton(ctx, bgmButton, bgmEnabled ? '背景音乐：开' : '背景音乐：关', {
      color: bgmEnabled ? COLORS.green : COLORS.panelLight,
      textColor: bgmEnabled ? COLORS.bgDeep : COLORS.text,
      pressed: this.pressedId === 'SETTINGS_BGM',
    });

    drawMeter(ctx, meter, meterLevel, {
      color: meterLevel > 65 ? COLORS.red : meterLevel > 35 ? COLORS.orange : COLORS.green,
      label: audioState.isRecording ? '当前声量' : '待开麦检测',
    });

    drawPixelText(ctx, audioState.isRecording ? '说话或喊一声，确认声量反馈' : '开始挑战前会自动申请麦克风权限', modal.x + 18, meter.y + meter.h + 12, {
      size: 12,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });

    if (audioState.error) {
      drawPixelText(ctx, audioState.error, modal.x + 18, modal.y + modal.h - 26, {
        size: 11,
        color: COLORS.yellow,
        shadow: null,
        weight: '700',
      });
    }
  }

  handleTouchStart(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    this.dragStartY = y;
    this.dragLastY = y;
    this.dragMoved = false;

    if (this.settingsOpen) {
      if (hitTest(this.layout.settingsCloseButton, x, y)) {
        this.press('SETTINGS_CLOSE');
        return;
      }

      if (hitTest(this.layout.settingsMicButton, x, y)) {
        this.press('SETTINGS_MIC');
        return;
      }

      if (hitTest(this.layout.settingsBgmButton, x, y)) {
        this.press('SETTINGS_BGM');
        return;
      }

      if (!hitTest(this.layout.settingsModal, x, y)) {
        this.press('SETTINGS_SCRIM');
      }
      return;
    }

    if (hitTest(this.layout.settingsButton, x, y)) {
      this.press('SETTINGS');
      return;
    }

    const card = [this.layout.featuredCard, ...this.layout.cards].find((item) => this.hitTestScrolledCard(item, x, y));
    if (card) {
      this.press(card.id);
    }
  }

  handleTouchMove(touch) {
    if (this.settingsOpen || this.scrollMax <= 0) {
      return;
    }

    const x = touch.clientX;
    const y = touch.clientY;
    if (!hitTest(this.layout.gridClip, x, y)) {
      this.dragLastY = y;
      return;
    }

    const deltaY = y - this.dragLastY;
    this.dragLastY = y;

    if (Math.abs(y - this.dragStartY) > 6) {
      this.dragMoved = true;
      this.pressedId = '';
    }

    this.scrollY = Math.max(0, Math.min(this.scrollMax, this.scrollY - deltaY));
  }

  handleTouchEnd(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const pressedId = this.pressedId;

    this.pressedTimer = 0.12;

    if (this.settingsOpen) {
      if (pressedId === 'SETTINGS_CLOSE' && hitTest(this.layout.settingsCloseButton, x, y)) {
        this.settingsOpen = false;
        return;
      }

      if (pressedId === 'SETTINGS_SCRIM' && !hitTest(this.layout.settingsModal, x, y)) {
        this.settingsOpen = false;
        return;
      }

      if (pressedId === 'SETTINGS_MIC' && hitTest(this.layout.settingsMicButton, x, y)) {
        this.toggleMicrophone();
        return;
      }

      if (pressedId === 'SETTINGS_BGM' && hitTest(this.layout.settingsBgmButton, x, y)) {
        this.settings.toggleBgmEnabled();
        this.music.applyBgmEnabled();
        return;
      }

      return;
    }

    if (pressedId === 'SETTINGS' && hitTest(this.layout.settingsButton, x, y)) {
      this.settingsOpen = true;
      return;
    }

    if (this.dragMoved) {
      this.dragMoved = false;
      return;
    }

    const card = [this.layout.featuredCard, ...this.layout.cards].find((item) => pressedId === item.id && this.hitTestScrolledCard(item, x, y));
    if (card) {
      this.enterGame(card.id);
    }
  }

  hitTestScrolledCard(card, x, y) {
    if (!hitTest(this.layout.gridClip, x, y)) {
      return false;
    }

    return hitTest({
      x: card.x,
      y: card.y - this.scrollY,
      w: card.w,
      h: card.h,
    }, x, y);
  }

  toggleMicrophone() {
    if (this.audio.getState().canOpenSetting) {
      this.audio.openSetting();
      this.showToast('请开启麦克风权限');
    } else {
      this.audio.start();
      this.showToast('正在开启麦克风');
    }
  }

  async enterGame(gameId) {
    await this.audio.refreshPermissionStatus();
    const state = this.audio.getState();
    if (state.permission === 'unknown') {
      this.showToast('正在申请麦克风权限');
    }

    this.goToGame(gameId).then((result) => {
      const entered = typeof result === 'boolean' ? result : result.entered;
      if (!entered) {
        const state = this.audio.getState();
        this.showToast(state.canOpenSetting ? '请先开启麦克风权限' : '麦克风不可用，无法开始');
      }
    });
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
