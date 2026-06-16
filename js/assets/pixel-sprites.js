import { COLORS } from '../core/constants.js';

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawPixelMic(ctx, x, y, size, color = COLORS.orange) {
  const unit = size / 12;
  rect(ctx, x + unit * 4, y + unit, unit * 4, unit * 6, color);
  rect(ctx, x + unit * 3, y + unit * 2, unit, unit * 4, COLORS.bgDeep);
  rect(ctx, x + unit * 8, y + unit * 2, unit, unit * 4, COLORS.bgDeep);
  rect(ctx, x + unit * 3, y + unit * 7, unit * 6, unit, color);
  rect(ctx, x + unit * 5, y + unit * 8, unit * 2, unit * 2, color);
  rect(ctx, x + unit * 3, y + unit * 10, unit * 6, unit, color);
}

export function drawPixelBird(ctx, x, y, size, color = COLORS.orange) {
  const unit = size / 12;
  rect(ctx, x + unit * 2, y + unit * 3, unit * 6, unit * 5, color);
  rect(ctx, x + unit * 4, y + unit * 2, unit * 4, unit, color);
  rect(ctx, x + unit * 8, y + unit * 4, unit * 3, unit * 2, COLORS.yellow);
  rect(ctx, x + unit * 7, y + unit * 3, unit, unit, COLORS.text);
  rect(ctx, x + unit * 7.5, y + unit * 3.5, unit * 0.5, unit * 0.5, COLORS.bgDeep);
  rect(ctx, x + unit, y + unit * 5, unit * 2, unit * 2, '#EA580C');
  rect(ctx, x + unit * 4, y + unit * 8, unit, unit, COLORS.yellow);
  rect(ctx, x + unit * 6, y + unit * 8, unit, unit, COLORS.yellow);
}

export function drawPixelCar(ctx, x, y, size, color = COLORS.cyan) {
  const unit = size / 14;
  rect(ctx, x + unit * 2, y + unit * 5, unit * 10, unit * 4, color);
  rect(ctx, x + unit * 5, y + unit * 3, unit * 4, unit * 2, '#BAE6FD');
  rect(ctx, x + unit * 9, y + unit * 4, unit * 2, unit, '#BAE6FD');
  rect(ctx, x + unit * 3, y + unit * 9, unit * 2, unit * 2, COLORS.bgDeep);
  rect(ctx, x + unit * 9, y + unit * 9, unit * 2, unit * 2, COLORS.bgDeep);
  rect(ctx, x + unit * 3.5, y + unit * 9.5, unit, unit, COLORS.textMuted);
  rect(ctx, x + unit * 9.5, y + unit * 9.5, unit, unit, COLORS.textMuted);
}

export function drawPixelRocket(ctx, x, y, size, color = COLORS.rose) {
  const unit = size / 14;
  rect(ctx, x + unit * 5, y + unit, unit * 4, unit * 8, color);
  rect(ctx, x + unit * 6, y, unit * 2, unit, COLORS.text);
  rect(ctx, x + unit * 6, y + unit * 3, unit * 2, unit * 2, '#BAE6FD');
  rect(ctx, x + unit * 3, y + unit * 7, unit * 2, unit * 3, COLORS.orange);
  rect(ctx, x + unit * 9, y + unit * 7, unit * 2, unit * 3, COLORS.orange);
  rect(ctx, x + unit * 6, y + unit * 9, unit * 2, unit * 2, COLORS.yellow);
  rect(ctx, x + unit * 5, y + unit * 11, unit * 4, unit * 2, COLORS.orange);
}

export function drawPixelBolt(ctx, x, y, size, color = COLORS.blue) {
  const unit = size / 10;
  rect(ctx, x + unit * 5, y, unit * 2, unit * 4, color);
  rect(ctx, x + unit * 3, y + unit * 3, unit * 4, unit * 2, color);
  rect(ctx, x + unit * 4, y + unit * 5, unit * 2, unit * 5, color);
  rect(ctx, x + unit * 2, y + unit * 6, unit * 4, unit * 2, color);
}

export function drawPixelMage(ctx, x, y, size, color = COLORS.purple) {
  const unit = size / 12;
  rect(ctx, x + unit * 4, y + unit, unit * 4, unit * 2, color);
  rect(ctx, x + unit * 3, y + unit * 3, unit * 6, unit, color);
  rect(ctx, x + unit * 4, y + unit * 4, unit * 4, unit * 3, '#F8C7A2');
  rect(ctx, x + unit * 5, y + unit * 5, unit, unit, COLORS.bgDeep);
  rect(ctx, x + unit * 7, y + unit * 5, unit, unit, COLORS.bgDeep);
  rect(ctx, x + unit * 3, y + unit * 7, unit * 6, unit * 4, color);
  rect(ctx, x + unit * 9, y + unit * 3, unit, unit * 8, COLORS.yellow);
  rect(ctx, x + unit * 8, y + unit * 2, unit * 3, unit, COLORS.cyan);
}

export function drawGameIcon(ctx, id, x, y, size, color) {
  if (id === 'SCREAM_BIRD') {
    drawPixelBird(ctx, x, y, size, color);
    return;
  }

  if (id === 'SPRINT') {
    drawPixelCar(ctx, x, y, size, color);
    return;
  }

  if (id === 'ROCKET') {
    drawPixelRocket(ctx, x, y, size, color);
    return;
  }

  if (id === 'PUNCH') {
    drawPixelBolt(ctx, x, y, size, color);
    return;
  }

  drawPixelMage(ctx, x, y, size, color);
}
