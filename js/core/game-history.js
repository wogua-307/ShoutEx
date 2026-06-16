const STORAGE_PREFIX = 'shoutex.history.';
const MAX_HISTORY = 20;

export function getGameHistory(gameId, limit = 3) {
  const history = wx.getStorageSync(`${STORAGE_PREFIX}${gameId}`) || [];
  return Array.isArray(history) ? history.slice(0, limit) : [];
}

export function addGameHistory(gameId, result) {
  const key = `${STORAGE_PREFIX}${gameId}`;
  const history = wx.getStorageSync(key) || [];
  const next = [{
    endedAt: Date.now(),
    result,
  }, ...(Array.isArray(history) ? history : [])].slice(0, MAX_HISTORY);

  wx.setStorageSync(key, next);
  return next;
}

export function formatHistoryTime(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => `${value}`.padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
