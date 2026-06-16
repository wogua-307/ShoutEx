import './render.js';
import Timing from './core/timing.js';
import SceneManager from './core/scene-manager.js';
import AudioLevelService from './services/audio-level.js';
import GameSettingsService from './services/game-settings.js';
import MusicService from './services/music.js';
import MenuScene from './scenes/menu.js';
import ScreamBirdScene from './scenes/scream-bird.js';
import SprintGameScene from './scenes/sprint-game.js';
import RocketGameScene from './scenes/rocket-game.js';
import PunchGameScene from './scenes/punch-game.js';
import MageGameScene from './scenes/mage-game.js';

const ctx = canvas.getContext('2d');

export default class Main {
  constructor() {
    this.aniId = 0;
    this.timing = new Timing();
    this.settings = new GameSettingsService();
    this.audio = new AudioLevelService(this.settings);
    this.music = new MusicService(this.settings);
    this.sceneManager = new SceneManager({}, 'MENU');
    this.sceneManager.setScenes({
      MENU: new MenuScene({
        audio: this.audio,
        settings: this.settings,
        music: this.music,
        goToGame: this.goToGame.bind(this),
      }),
      SCREAM_BIRD: new ScreamBirdScene({
        audio: this.audio,
        settings: this.settings,
        music: this.music,
        goToMenu: this.goToMenu.bind(this),
      }),
      SPRINT: new SprintGameScene({
        audio: this.audio,
        settings: this.settings,
        music: this.music,
        goToMenu: this.goToMenu.bind(this),
      }),
      ROCKET: new RocketGameScene({
        audio: this.audio,
        settings: this.settings,
        music: this.music,
        goToMenu: this.goToMenu.bind(this),
      }),
      PUNCH: new PunchGameScene({
        audio: this.audio,
        settings: this.settings,
        music: this.music,
        goToMenu: this.goToMenu.bind(this),
      }),
      MAGE: new MageGameScene({
        audio: this.audio,
        settings: this.settings,
        music: this.music,
        goToMenu: this.goToMenu.bind(this),
      }),
    }, 'MENU');

    wx.onTouchStart(this.handleTouchStart.bind(this));
    wx.onTouchEnd(this.handleTouchEnd.bind(this));

    if (wx.onHide) {
      wx.onHide(this.handleHide.bind(this));
    }
    if (wx.onShow) {
      wx.onShow(this.handleShow.bind(this));
    }

    this.audio.refreshPermissionStatus();
    this.music.playHome();
    this.start();
  }

  start() {
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  async goToGame(gameId) {
    if (!this.sceneManager.scenes[gameId]) {
      return { entered: false, requestedPermission: false };
    }

    await this.audio.refreshPermissionStatus();
    const requestedPermission = this.audio.getState().permission !== 'granted';
    const hasMicPermission = await this.audio.start();
    if (!hasMicPermission) {
      return { entered: false, requestedPermission };
    }

    this.sceneManager.goTo(gameId);
    this.music.playForGame(gameId);
    return { entered: true, requestedPermission };
  }

  goToMenu() {
    this.sceneManager.goTo('MENU');
    this.music.playHome();
  }

  getTouch(event) {
    return (event.changedTouches && event.changedTouches[0]) ||
      (event.touches && event.touches[0]) ||
      null;
  }

  handleTouchStart(event) {
    this.music.startByGesture();

    const touch = this.getTouch(event);
    if (touch) {
      this.sceneManager.handleTouchStart(touch);
    }
  }

  handleTouchEnd(event) {
    const touch = this.getTouch(event);
    if (touch) {
      this.sceneManager.handleTouchEnd(touch);
    }
  }

  handleHide() {
    this.audio.pause();
    this.music.pause();
  }

  handleShow() {
    this.audio.resume();
    this.music.resume();
  }

  update(frame) {
    this.audio.update(frame.delta);
    this.sceneManager.update(frame);
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.sceneManager.render(ctx);
  }

  loop(time) {
    const frame = this.timing.tick(time);
    this.update(frame);
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
