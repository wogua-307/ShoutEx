import { COLORS, TOUCH } from '../core/constants.js';

export function hitTest(rect, x, y) {
  return !!rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function setText(ctx, size, weight = '700') {
  ctx.font = `${weight} ${size}px Arial`;
  ctx.textBaseline = 'top';
}

export function drawPixelText(ctx, text, x, y, options = {}) {
  const {
    size = 18,
    color = COLORS.text,
    shadow = COLORS.shadow,
    weight = '700',
    align = 'left',
  } = options;

  setText(ctx, size, weight);
  ctx.textAlign = align;

  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(text, x + 2, y + 2);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

export function drawPanel(ctx, rect, options = {}) {
  const {
    fill = COLORS.panel,
    border = COLORS.border,
    shadow = COLORS.shadow,
    shadowOffset = 4,
  } = options;

  ctx.fillStyle = shadow;
  ctx.fillRect(rect.x + shadowOffset, rect.y + shadowOffset, rect.w, rect.h);

  ctx.fillStyle = fill;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
}

export function drawButton(ctx, rect, label, options = {}) {
  const {
    color = COLORS.orange,
    textColor = COLORS.bgDeep,
    pressed = false,
    disabled = false,
  } = options;

  const offset = pressed ? 2 : 0;
  const minHeight = Math.max(rect.h, TOUCH.minSize);
  const box = { x: rect.x, y: rect.y, w: rect.w, h: minHeight };

  drawPanel(ctx, {
    x: box.x,
    y: box.y + offset,
    w: box.w,
    h: box.h,
  }, {
    fill: disabled ? COLORS.panelLight : color,
    border: disabled ? COLORS.textDim : COLORS.border,
    shadow: COLORS.shadow,
    shadowOffset: pressed ? 2 : 4,
  });

  drawPixelText(ctx, label, box.x + box.w / 2, box.y + offset + box.h / 2 - 9, {
    size: 18,
    color: disabled ? COLORS.textMuted : textColor,
    shadow: disabled ? null : 'rgba(255,255,255,0.35)',
    align: 'center',
  });
}

export function drawMeter(ctx, rect, level, options = {}) {
  const {
    color = COLORS.orange,
    label = 'VOICE ENERGY',
  } = options;

  drawPanel(ctx, rect, {
    fill: COLORS.panelDark,
    border: COLORS.panelLight,
    shadowOffset: 3,
  });

  const inner = {
    x: rect.x + 8,
    y: rect.y + 28,
    w: rect.w - 16,
    h: rect.h - 40,
  };
  const fillWidth = Math.max(4, inner.w * Math.min(100, Math.max(0, level)) / 100);

  drawPixelText(ctx, label, rect.x + 10, rect.y + 8, {
    size: 11,
    color: COLORS.textMuted,
    shadow: null,
    weight: '700',
  });
  drawPixelText(ctx, `${Math.round(level)}%`, rect.x + rect.w - 10, rect.y + 8, {
    size: 12,
    color: COLORS.text,
    shadow: null,
    weight: '700',
    align: 'right',
  });

  ctx.fillStyle = COLORS.bgDeep;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  ctx.fillStyle = color;
  ctx.fillRect(inner.x, inner.y, fillWidth, inner.h);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = inner.x + 8; x < inner.x + fillWidth; x += 14) {
    ctx.fillRect(x, inner.y, 4, inner.h);
  }
}

export function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
  const { size = 14, color = COLORS.textMuted, weight = '400' } = options;
  setText(ctx, size, weight);
  ctx.fillStyle = color;

  const chars = text.split('');
  let line = '';
  let currentY = y;

  chars.forEach((char) => {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) {
    ctx.fillText(line, x, currentY);
  }
}
