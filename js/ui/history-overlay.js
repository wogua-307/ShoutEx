import { COLORS, SCREEN } from '../core/constants.js';
import {
  drawButton,
  drawIconButton,
  drawPanel,
  drawPixelText,
  hitTest,
} from './pixel-ui.js';
import { drawHistoryList } from './history-panel.js';

export default class HistoryOverlay {
  constructor(options) {
    this.title = options.title;
    this.accent = options.accent || COLORS.cyan;
    this.getHistory = options.getHistory;
    this.open = false;
    this.pressedId = '';
    this.layout = {};
  }

  setTopControls(top, margin, offset = 56) {
    const menuButtonLeft = SCREEN.menuButton ? SCREEN.menuButton.left : SCREEN.width;
    const preferredX = margin + offset;
    const maxX = Math.min(SCREEN.width - margin - 44, menuButtonLeft - 52);
    const button = {
      x: Math.max(margin, Math.min(preferredX, maxX)),
      y: SCREEN.menuButton ? Math.max(top, Math.min(SCREEN.menuButton.top, top + 6)) : top,
      w: 44,
      h: 44,
    };
    const modalW = Math.min(SCREEN.width - margin * 2, 340);
    const modalH = 300;
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
      list: { x: modal.x + 18, y: modal.y + 82, w: modal.w - 36, h: 150 },
      okButton: { x: modal.x + 18, y: modal.y + modal.h - 62, w: modal.w - 36, h: 44 },
    };
  }

  drawButton(ctx) {
    drawIconButton(ctx, this.layout.button, 'history', {
      color: COLORS.panel,
      iconColor: COLORS.text,
      pressed: this.pressedId === 'HISTORY',
    });
  }

  drawModal(ctx) {
    if (!this.open) {
      return;
    }

    const { modal, closeButton, list, okButton } = this.layout;
    const history = this.getHistory ? this.getHistory() : [];
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

    drawPanel(ctx, modal, {
      fill: COLORS.panel,
      border: this.accent,
      shadowOffset: 6,
    });

    drawPixelText(ctx, '历史记录', modal.x + 18, modal.y + 18, {
      size: 24,
      color: COLORS.text,
      shadow: this.accent,
      weight: '900',
    });
    drawPixelText(ctx, this.title, modal.x + 18, modal.y + 52, {
      size: 13,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
      maxWidth: modal.w - 96,
    });
    drawIconButton(ctx, closeButton, 'close', {
      color: COLORS.panelDark,
      iconColor: COLORS.text,
      pressed: this.pressedId === 'HISTORY_CLOSE',
    });

    drawHistoryList(ctx, history, list);
    drawButton(ctx, okButton, '关闭', {
      color: this.accent,
      pressed: this.pressedId === 'HISTORY_OK',
    });
  }

  handleTouchStart(touch) {
    const x = touch.clientX;
    const y = touch.clientY;

    if (!this.open) {
      if (hitTest(this.layout.button, x, y)) {
        this.press('HISTORY');
        return true;
      }
      return false;
    }

    if (hitTest(this.layout.closeButton, x, y)) {
      this.press('HISTORY_CLOSE');
      return true;
    }
    if (hitTest(this.layout.okButton, x, y)) {
      this.press('HISTORY_OK');
      return true;
    }
    if (!hitTest(this.layout.modal, x, y)) {
      this.press('HISTORY_SCRIM');
    }
    return true;
  }

  handleTouchEnd(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const pressedId = this.pressedId;
    this.pressedId = '';

    if (!this.open) {
      if (pressedId === 'HISTORY' && hitTest(this.layout.button, x, y)) {
        this.open = true;
        return true;
      }
      return pressedId === 'HISTORY';
    }

    if (
      (pressedId === 'HISTORY_CLOSE' && hitTest(this.layout.closeButton, x, y)) ||
      (pressedId === 'HISTORY_OK' && hitTest(this.layout.okButton, x, y)) ||
      (pressedId === 'HISTORY_SCRIM' && !hitTest(this.layout.modal, x, y))
    ) {
      this.open = false;
      return true;
    }

    return true;
  }

  press(id) {
    this.pressedId = id;
  }
}
