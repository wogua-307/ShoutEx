const STORAGE_KEY = 'shoutex.gameSettings';

const DEFAULTS = {
  voiceSensitivity: 100,
  gameVolume: 35,
  bgmEnabled: true,
};

const LIMITS = {
  voiceSensitivity: { min: 60, max: 160, step: 10 },
  gameVolume: { min: 0, max: 100, step: 5 },
};

export default class GameSettingsService {
  constructor() {
    this.state = this.load();
  }

  load() {
    const saved = wx.getStorageSync(STORAGE_KEY) || {};
    return {
      voiceSensitivity: this.clampValue('voiceSensitivity', saved.voiceSensitivity ?? DEFAULTS.voiceSensitivity),
      gameVolume: this.clampValue('gameVolume', saved.gameVolume ?? DEFAULTS.gameVolume),
      bgmEnabled: saved.bgmEnabled ?? DEFAULTS.bgmEnabled,
    };
  }

  save() {
    wx.setStorageSync(STORAGE_KEY, this.state);
  }

  clampValue(key, value) {
    const limit = LIMITS[key];
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return DEFAULTS[key];
    }
    return Math.max(limit.min, Math.min(limit.max, Math.round(numeric)));
  }

  adjustVoiceSensitivity(direction) {
    this.state.voiceSensitivity = this.clampValue(
      'voiceSensitivity',
      this.state.voiceSensitivity + LIMITS.voiceSensitivity.step * direction
    );
    this.save();
  }

  adjustGameVolume(direction) {
    this.state.gameVolume = this.clampValue(
      'gameVolume',
      this.state.gameVolume + LIMITS.gameVolume.step * direction
    );
    this.save();
  }

  getVoiceSensitivity() {
    return this.state.voiceSensitivity;
  }

  getVoiceMultiplier() {
    return this.state.voiceSensitivity / 100;
  }

  getGameVolumePercent() {
    return this.state.gameVolume;
  }

  getGameVolumeValue() {
    return (this.state.gameVolume / 100) * 0.38;
  }

  isBgmEnabled() {
    return this.state.bgmEnabled;
  }

  toggleBgmEnabled() {
    this.state.bgmEnabled = !this.state.bgmEnabled;
    this.save();
    return this.state.bgmEnabled;
  }
}
