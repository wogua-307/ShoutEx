import { COLORS, TOUCH } from '../core/constants.js';

export function hitTest(rect, x, y) {
  return !!rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function setText(ctx, size, weight = '700') {
  ctx.font = `${weight} ${size}px Arial`;
  ctx.textBaseline = 'top';
}

function measureText(ctx, text, size, weight) {
  setText(ctx, size, weight);
  if (ctx.measureText) {
    return ctx.measureText(text).width;
  }
  return text.length * size * 0.72;
}

export function fitText(ctx, text, maxWidth, options = {}) {
  const { size = 18, weight = '700', suffix = '...' } = options;
  const value = String(text);

  if (!maxWidth || maxWidth <= 0 || measureText(ctx, value, size, weight) <= maxWidth) {
    return value;
  }

  if (measureText(ctx, suffix, size, weight) > maxWidth) {
    return '';
  }

  let end = value.length;
  while (end > 0) {
    const candidate = `${value.slice(0, end)}${suffix}`;
    if (measureText(ctx, candidate, size, weight) <= maxWidth) {
      return candidate;
    }
    end -= 1;
  }

  return '';
}

export function drawPixelText(ctx, text, x, y, options = {}) {
  const {
    size = 18,
    color = COLORS.text,
    shadow = COLORS.shadow,
    weight = '700',
    align = 'left',
    maxWidth = 0,
    suffix = '...',
  } = options;

  setText(ctx, size, weight);
  ctx.textAlign = align;
  const displayText = maxWidth ? fitText(ctx, text, maxWidth, { size, weight, suffix }) : String(text);

  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(displayText, x + 2, y + 2);
  }

  ctx.fillStyle = color;
  ctx.fillText(displayText, x, y);
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

export function roundedPath(ctx, rect, radius = 16) {
  const r = Math.min(radius, rect.w / 2, rect.h / 2);
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.w - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + r);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h - r);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y + rect.h, rect.x + rect.w - r, rect.y + rect.h);
  ctx.lineTo(rect.x + r, rect.y + rect.h);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
}

export function drawRoundedPanel(ctx, rect, options = {}) {
  const {
    fill = COLORS.panelDark,
    border = COLORS.panelLight,
    radius = 18,
    glow = null,
    glowAlpha = 0.18,
    lineWidth = 2,
  } = options;

  if (glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = glowAlpha;
    ctx.fillStyle = glow;
    roundedPath(ctx, rect, radius);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = fill;
  roundedPath(ctx, rect, radius);
  ctx.fill();

  ctx.strokeStyle = border;
  ctx.lineWidth = lineWidth;
  roundedPath(ctx, {
    x: rect.x + 1,
    y: rect.y + 1,
    w: rect.w - 2,
    h: rect.h - 2,
  }, Math.max(0, radius - 1));
  ctx.stroke();
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

export function drawBackIconButton(ctx, rect, options = {}) {
  const {
    color = COLORS.panel,
    iconColor = COLORS.text,
    pressed = false,
    disabled = false,
  } = options;

  const offset = pressed ? 2 : 0;
  const box = {
    x: rect.x,
    y: rect.y,
    w: Math.max(rect.w, TOUCH.minSize),
    h: Math.max(rect.h, TOUCH.minSize),
  };

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

  const centerX = Math.round(box.x + box.w / 2);
  const centerY = Math.round(box.y + offset + box.h / 2);
  const startX = centerX - 10;
  const startY = centerY - 10;

  function drawArrow(dx, dy, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(startX + dx + 8, startY + dy, 4, 4);
    ctx.fillRect(startX + dx + 4, startY + dy + 4, 4, 4);
    ctx.fillRect(startX + dx, startY + dy + 8, 24, 4);
    ctx.fillRect(startX + dx + 4, startY + dy + 12, 4, 4);
    ctx.fillRect(startX + dx + 8, startY + dy + 16, 4, 4);
  }

  drawArrow(1, 1, disabled ? COLORS.shadow : 'rgba(0,0,0,0.36)');
  drawArrow(0, 0, disabled ? COLORS.textMuted : iconColor);
}

export function drawIconButton(ctx, rect, icon, options = {}) {
  const {
    color = COLORS.panel,
    iconColor = COLORS.text,
    pressed = false,
    disabled = false,
  } = options;

  const offset = pressed ? 2 : 0;
  const box = {
    x: rect.x,
    y: rect.y,
    w: Math.max(rect.w, TOUCH.minSize),
    h: Math.max(rect.h, TOUCH.minSize),
  };

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

  const centerX = Math.round(box.x + box.w / 2);
  const centerY = Math.round(box.y + offset + box.h / 2);
  const startX = centerX - 10;
  const startY = centerY - 10;
  const fill = disabled ? COLORS.textMuted : iconColor;
  const iconShadow = disabled ? COLORS.shadow : 'rgba(0,0,0,0.36)';
  drawIconGlyph(ctx, icon, startX + 1, startY + 1, iconShadow);
  drawIconGlyph(ctx, icon, startX, startY, fill);
}

function drawIconGlyph(ctx, icon, x, y, fill) {
  ctx.fillStyle = fill;

  if (icon === 'close') {
    for (let i = 0; i < 5; i += 1) {
      ctx.fillRect(x + i * 4, y + i * 4, 4, 4);
      ctx.fillRect(x + 16 - i * 4, y + i * 4, 4, 4);
    }
    return;
  }

  if (icon === 'minus') {
    ctx.fillRect(x + 3, y + 8, 14, 4);
    return;
  }

  if (icon === 'plus') {
    ctx.fillRect(x + 3, y + 8, 14, 4);
    ctx.fillRect(x + 8, y + 3, 4, 14);
    return;
  }

  ctx.fillRect(x + 8, y, 4, 4);
  ctx.fillRect(x + 8, y + 16, 4, 4);
  ctx.fillRect(x, y + 8, 4, 4);
  ctx.fillRect(x + 16, y + 8, 4, 4);
  ctx.fillRect(x + 4, y + 4, 12, 12);
  ctx.fillStyle = COLORS.bgDeep;
  ctx.fillRect(x + 8, y + 8, 4, 4);
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
