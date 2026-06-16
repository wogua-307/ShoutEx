import { COLORS } from '../core/constants.js';
import { formatHistoryTime } from '../core/game-history.js';
import { drawPixelText } from './pixel-ui.js';

export function drawHistoryList(ctx, history, rect) {
  drawPixelText(ctx, '最近记录', rect.x, rect.y, {
    size: 13,
    color: COLORS.textMuted,
    shadow: null,
    weight: '700',
    maxWidth: rect.w,
  });

  if (!history.length) {
    drawPixelText(ctx, '暂无记录', rect.x, rect.y + 22, {
      size: 12,
      color: COLORS.textDim,
      shadow: null,
      weight: '700',
      maxWidth: rect.w,
    });
    return;
  }

  const maxRows = Math.max(1, Math.min(3, Math.floor((rect.h - 22) / 20)));
  history.slice(0, maxRows).forEach((item, index) => {
    drawPixelText(ctx, `${formatHistoryTime(item.endedAt)}  ${item.result}`, rect.x, rect.y + 22 + index * 20, {
      size: 12,
      color: COLORS.textMuted,
      shadow: null,
      weight: '700',
      maxWidth: rect.w,
    });
  });
}
