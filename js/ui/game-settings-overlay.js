import { COLORS, SCREEN } from '../core/constants.js';
import {
  drawButton,
  drawIconButton,
  drawPanel,
  drawPixelText,
  hitTest,
} from './pixel-ui.js';

export default class GameSettingsOverlay {
  constructor(settings, music) {
    this.settings = settings;
    this.music = music;
    this.open = false;
    this.pressedId = '';
    this.layout = {};
  }

  setTopControls(top, margin) {
    const menuButtonLeft = SCREEN.menuButton ? SCREEN.menuButton.left : SCREEN.width;
    const preferredX = margin + 56;
    const maxX = Math.min(SCREEN.width - margin - 44, menuButtonLeft - 52);
    const button = {
      x: Math.max(margin, Math.min(preferredX, maxX)),
      y: SCREEN.menuButton ? Math.max(top, Math.min(SCREEN.menuButton.top, top + 6)) : top,
      w: 44,
      h: 44,
    };
    const modalW = Math.min(SCREEN.width - margin * 2, 340);
    const modalH = 332;
    const bottom = SCREEN.height - Math.max(16, SCREEN.safeBottom + 16);
    const modalY = Math.max(top + 58, Math.min(Math.round((SCREEN.height - modalH) / 2), bottom - modalH));
    const modal = {
      x: Math.round((SCREEN.width - modalW) / 2),
      y: modalY,
      w: modalW,
      h: modalH,
    };

    this.layout = {
      button,
      modal,
      closeButton: { x: modal.x + modal.w - 58, y: modal.y + 12, w: 44, h: 44 },
      sensitivityMinus: { x: modal.x + 18, y: modal.y + 86, w: 44, h: 44 },
      sensitivityPlus: { x: modal.x + modal.w - 62, y: modal.y + 86, w: 44, h: 44 },
      sensitivityBar: { x: modal.x + 74, y: modal.y + 101, w: modal.w - 148, h: 14 },
      volumeMinus: { x: modal.x + 18, y: modal.y + 166, w: 44, h: 44 },
      volumePlus: { x: modal.x + modal.w - 62, y: modal.y + 166, w: 44, h: 44 },
      volumeBar: { x: modal.x + 74, y: modal.y + 181, w: modal.w - 148, h: 14 },
      bgmButton: { x: modal.x + 18, y: modal.y + 232, w: modal.w - 36, h: 44 },
    };
  }

  close() {
    this.open = false;
    this.pressedId = '';
  }

  draw(ctx) {
    this.drawButton(ctx);
    this.drawModal(ctx);
  }

  drawButton(ctx) {
    drawIconButton(ctx, this.layout.button, 'settings', {
      color: COLORS.panel,
      iconColor: COLORS.text,
      pressed: this.pressedId === 'GAME_SETTINGS',
    });
  }

  drawModal(ctx) {
    if (this.open) {
      this.drawModalContent(ctx);
    }
  }

  drawModalContent(ctx) {
    const { modal, closeButton } = this.layout;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    drawPanel(ctx, modal, {
      fill: COLORS.panel,
      border: COLORS.cyan,
      shadowOffset: 6,
    });

    drawPixelText(ctx, '游戏设置', modal.x + 18, modal.y + 18, {
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

    this.drawSettingRow(ctx, {
      label: '声控灵敏度',
      value: this.settings.getVoiceSensitivity(),
      min: 60,
      max: 160,
      y: modal.y + 62,
      minus: this.layout.sensitivityMinus,
      plus: this.layout.sensitivityPlus,
      bar: this.layout.sensitivityBar,
      pressedMinus: this.pressedId === 'SENS_MINUS',
      pressedPlus: this.pressedId === 'SENS_PLUS',
    });

    this.drawSettingRow(ctx, {
      label: '游戏音量',
      value: this.settings.getGameVolumePercent(),
      min: 0,
      max: 100,
      y: modal.y + 142,
      minus: this.layout.volumeMinus,
      plus: this.layout.volumePlus,
      bar: this.layout.volumeBar,
      pressedMinus: this.pressedId === 'VOL_MINUS',
      pressedPlus: this.pressedId === 'VOL_PLUS',
    });

    drawPixelText(ctx, '背景音乐', modal.x + 18, modal.y + 218, {
      size: 14,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
    drawButton(ctx, this.layout.bgmButton, this.settings.isBgmEnabled() ? '背景音乐：开' : '背景音乐：关', {
      color: this.settings.isBgmEnabled() ? COLORS.green : COLORS.panelLight,
      textColor: this.settings.isBgmEnabled() ? COLORS.bgDeep : COLORS.text,
      pressed: this.pressedId === 'BGM_TOGGLE',
    });

    drawPixelText(ctx, '调低音量可减少对喊声控制的干扰', modal.x + 18, modal.y + modal.h - 32, {
      size: 12,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
  }

  drawSettingRow(ctx, config) {
    const ratio = (config.value - config.min) / (config.max - config.min);
    const fillWidth = Math.max(4, config.bar.w * Math.max(0, Math.min(1, ratio)));

    drawPixelText(ctx, config.label, config.minus.x, config.y, {
      size: 14,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
    });
    drawPixelText(ctx, `${config.value}%`, config.plus.x + config.plus.w, config.y, {
      size: 14,
      color: COLORS.yellow,
      shadow: null,
      align: 'right',
      weight: '900',
    });

    drawIconButton(ctx, config.minus, 'minus', {
      color: COLORS.panelDark,
      iconColor: COLORS.text,
      pressed: config.pressedMinus,
    });
    drawIconButton(ctx, config.plus, 'plus', {
      color: COLORS.panelDark,
      iconColor: COLORS.text,
      pressed: config.pressedPlus,
    });

    ctx.fillStyle = COLORS.bgDeep;
    ctx.fillRect(config.bar.x, config.bar.y, config.bar.w, config.bar.h);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(config.bar.x, config.bar.y, fillWidth, config.bar.h);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let x = config.bar.x + 8; x < config.bar.x + fillWidth; x += 16) {
      ctx.fillRect(x, config.bar.y, 4, config.bar.h);
    }
  }

  handleTouchStart(touch) {
    const x = touch.clientX;
    const y = touch.clientY;

    if (!this.open) {
      if (hitTest(this.layout.button, x, y)) {
        this.press('GAME_SETTINGS');
        return true;
      }
      return false;
    }

    const id = this.getModalHitId(x, y);
    if (id) {
      this.press(id);
    }
    return true;
  }

  handleTouchEnd(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const pressedId = this.pressedId;
    this.pressedId = '';

    if (!this.open) {
      if (pressedId === 'GAME_SETTINGS' && hitTest(this.layout.button, x, y)) {
        this.open = true;
        return true;
      }
      return pressedId === 'GAME_SETTINGS';
    }

    if (pressedId === 'SETTINGS_CLOSE' && hitTest(this.layout.closeButton, x, y)) {
      this.open = false;
      return true;
    }

    if (pressedId === 'SETTINGS_SCRIM' && !hitTest(this.layout.modal, x, y)) {
      this.open = false;
      return true;
    }

    if (pressedId === 'SENS_MINUS' && hitTest(this.layout.sensitivityMinus, x, y)) {
      this.settings.adjustVoiceSensitivity(-1);
      return true;
    }

    if (pressedId === 'SENS_PLUS' && hitTest(this.layout.sensitivityPlus, x, y)) {
      this.settings.adjustVoiceSensitivity(1);
      return true;
    }

    if (pressedId === 'VOL_MINUS' && hitTest(this.layout.volumeMinus, x, y)) {
      this.settings.adjustGameVolume(-1);
      this.music.applyGameVolume();
      return true;
    }

    if (pressedId === 'VOL_PLUS' && hitTest(this.layout.volumePlus, x, y)) {
      this.settings.adjustGameVolume(1);
      this.music.applyGameVolume();
      return true;
    }

    if (pressedId === 'BGM_TOGGLE' && hitTest(this.layout.bgmButton, x, y)) {
      this.settings.toggleBgmEnabled();
      this.music.applyBgmEnabled();
      return true;
    }

    return true;
  }

  getModalHitId(x, y) {
    if (hitTest(this.layout.closeButton, x, y)) return 'SETTINGS_CLOSE';
    if (hitTest(this.layout.sensitivityMinus, x, y)) return 'SENS_MINUS';
    if (hitTest(this.layout.sensitivityPlus, x, y)) return 'SENS_PLUS';
    if (hitTest(this.layout.volumeMinus, x, y)) return 'VOL_MINUS';
    if (hitTest(this.layout.volumePlus, x, y)) return 'VOL_PLUS';
    if (hitTest(this.layout.bgmButton, x, y)) return 'BGM_TOGGLE';
    if (!hitTest(this.layout.modal, x, y)) return 'SETTINGS_SCRIM';
    return '';
  }

  press(id) {
    this.pressedId = id;
  }
}
