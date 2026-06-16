import { COLORS, GAME_MODES, SCREEN } from '../core/constants.js';
import { drawGameIcon, drawPixelMic } from '../assets/pixel-sprites.js';
import {
  drawButton,
  drawIconButton,
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
    this.settings = options.settings;
    this.music = options.music;
    this.goToGame = options.goToGame;
    this.toast = '';
    this.toastTimer = 0;
    this.pressedId = '';
    this.pressedTimer = 0;
    this.time = 0;
    this.settingsOpen = false;
    this.layout = {};
  }

  onEnter() {
    this.computeLayout();
  }

  computeLayout() {
    const w = SCREEN.width;
    const h = SCREEN.height;
    const top = Math.max(18, SCREEN.statusBarHeight, SCREEN.safeTop) + 12;
    const bottomInset = Math.max(16, SCREEN.safeBottom + 16);
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

    const titleBottom = top + titleSize + 21;
    const headerBottom = Math.max(titleBottom, settingsButton.y + settingsButton.h);
    const featuredTop = headerBottom + (compact ? 18 : 26);
    const featuredH = Math.max(tiny ? 132 : 150, Math.min(tiny ? 142 : compact ? 168 : 200, h * (tiny ? 0.24 : 0.26)));
    const sectionTop = featuredTop + featuredH + (tiny ? 14 : compact ? 20 : 26);
    const gap = narrow ? 10 : compact ? 12 : 16;
    const cardW = Math.floor((contentW - gap) / 2);
    const availableCardH = h - sectionTop - bottomInset - 34;
    const cardH = Math.max(tiny ? 78 : 86, Math.min(tiny ? 90 : compact ? 98 : 108, (availableCardH - gap) / 2));
    const modalW = Math.min(contentW, 340);
    const modalH = compact ? 302 : 326;
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
        y: settingsModal.y + 190,
        w: settingsModal.w - 36,
        h: compact ? 58 : 64,
      },
      settingsBgmButton: {
        x: settingsModal.x + 18,
        y: settingsModal.y + 130,
        w: settingsModal.w - 36,
        h: 44,
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

    const compact = this.layout.compact || card.w < 158;
    const iconSize = Math.min(compact ? 42 : 48, card.h - 30);
    const textX = card.x + iconSize + 22;
    const textW = Math.max(32, card.x + card.w - textX - 10);

    drawGameIcon(ctx, card.game.id, card.x + 10, y + Math.max(12, (card.h - iconSize) / 2), iconSize, card.game.accent);
    drawPixelText(ctx, card.game.shortTitle, textX, y + (compact ? 12 : 14), {
      size: compact ? 16 : 18,
      color: COLORS.text,
      shadow: card.game.accent,
      weight: '900',
      maxWidth: textW,
    });
    drawPixelText(ctx, card.game.description, textX, y + (compact ? 38 : 42), {
      size: compact ? 11 : 12,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
      maxWidth: textW,
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

    drawPixelText(ctx, '背景音乐', modal.x + 18, modal.y + 112, {
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

    if (pressedId === FEATURED.id && hitTest(this.layout.featured, x, y)) {
      this.enterGame(FEATURED.id);
      return;
    }

    const card = this.layout.cards.find((item) => pressedId === item.id && hitTest(item, x, y));
    if (card) {
      this.enterGame(card.id);
    }
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
