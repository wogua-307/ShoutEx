import './render.js';
import Timing from './core/timing.js';
import SceneManager from './core/scene-manager.js';
import AudioLevelService from './services/audio-level.js';
import MenuScene from './scenes/menu.js';
import ScreamBirdScene from './scenes/scream-bird.js';

const ctx = canvas.getContext('2d');

export default class Main {
  constructor() {
    this.aniId = 0;
    this.timing = new Timing();
    this.audio = new AudioLevelService();
    this.sceneManager = new SceneManager({}, 'MENU');
    this.sceneManager.setScenes({
      MENU: new MenuScene({
        audio: this.audio,
        goToGame: this.goToGame.bind(this),
      }),
      SCREAM_BIRD: new ScreamBirdScene({
        audio: this.audio,
        goToMenu: () => this.sceneManager.goTo('MENU'),
      }),
    }, 'MENU');

    wx.onTouchStart(this.handleTouchStart.bind(this));
    wx.onTouchEnd(this.handleTouchEnd.bind(this));

    this.start();
  }

  start() {
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  goToGame(gameId) {
    if (gameId === 'SCREAM_BIRD') {
      this.audio.start();
      this.sceneManager.goTo('SCREAM_BIRD');
    }
  }

  handleTouchStart(event) {
    const touch = event.changedTouches && event.changedTouches[0];
    if (touch) {
      this.sceneManager.handleTouchStart(touch);
    }
  }

  handleTouchEnd(event) {
    const touch = event.changedTouches && event.changedTouches[0];
    if (touch) {
      this.sceneManager.handleTouchEnd(touch);
    }
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
