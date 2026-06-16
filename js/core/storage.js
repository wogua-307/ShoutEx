export function getHighScore(key) {
  return wx.getStorageSync(key) || 0;
}

export function setHighScore(key, score) {
  const current = getHighScore(key);

  if (score > current) {
    wx.setStorageSync(key, score);
    return score;
  }

  return current;
}
