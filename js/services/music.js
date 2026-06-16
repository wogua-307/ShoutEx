const HOME_TRACK = 'audio/home-bg.mp3';
const BIRD_TRACK = 'audio/bird.mp3';
const GAME_TRACKS = [
  'audio/jiepai.mp3',
];
const HOME_VOLUME = 0.28;

export default class MusicService {
  constructor(settings) {
    this.settings = settings;
    this.bgm = null;
    this.enabled = true;
    this.currentSrc = '';
    this.active = false;
    this.volume = HOME_VOLUME;
  }

  ensureBgm() {
    if (this.bgm || !wx.createInnerAudioContext) {
      return;
    }

    this.bgm = wx.createInnerAudioContext();
    this.bgm.loop = true;
    this.bgm.volume = this.volume;
  }

  startByGesture() {
    this.play();
  }

  playHome() {
    this.setTrack(HOME_TRACK, HOME_VOLUME);
    this.active = true;
    this.play();
  }

  playForGame(gameId) {
    const src = gameId === 'SCREAM_BIRD' ? BIRD_TRACK : this.pickRandomTrack();
    this.setTrack(src, this.getGameVolume());
    this.active = true;
    this.play();
  }

  pickRandomTrack() {
    if (GAME_TRACKS.length < 2) {
      return GAME_TRACKS[0];
    }

    const candidates = GAME_TRACKS.filter((src) => src !== this.currentSrc);
    const pool = candidates.length ? candidates : GAME_TRACKS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  setTrack(src, volume = this.volume) {
    if (!src) {
      return;
    }

    this.ensureBgm();
    if (!this.bgm) {
      return;
    }

    this.volume = volume;
    this.bgm.volume = volume;

    if (this.currentSrc !== src) {
      this.bgm.pause();
      this.currentSrc = src;
      this.bgm.src = src;
    }
  }

  play() {
    if (!this.enabled || !this.isBgmEnabled() || !this.currentSrc || !this.active) {
      return;
    }

    this.ensureBgm();
    if (this.bgm) {
      this.bgm.play();
    }
  }

  pause() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  stop() {
    this.active = false;
    this.pause();
  }

  resume() {
    this.play();
  }

  applyBgmEnabled() {
    if (!this.isBgmEnabled()) {
      this.pause();
      return;
    }

    this.play();
  }

  applyGameVolume() {
    if (!this.bgm || this.currentSrc === HOME_TRACK) {
      return;
    }

    this.volume = this.getGameVolume();
    this.bgm.volume = this.volume;
  }

  getGameVolume() {
    return this.settings ? this.settings.getGameVolumeValue() : 0.072;
  }

  isBgmEnabled() {
    return this.settings ? this.settings.isBgmEnabled() : true;
  }
}
