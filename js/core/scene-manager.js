export default class SceneManager {
  constructor(scenes, initialScene) {
    this.scenes = scenes;
    this.currentName = initialScene;
    this.currentScene = scenes[initialScene];

    if (this.currentScene && this.currentScene.onEnter) {
      this.currentScene.onEnter();
    }
  }

  setScenes(scenes, initialScene = this.currentName) {
    this.scenes = scenes;
    this.currentName = '';
    this.currentScene = null;
    this.goTo(initialScene);
  }

  goTo(name, payload = {}) {
    if (!this.scenes[name]) {
      return;
    }

    if (this.currentName === name && this.currentScene) {
      if (this.currentScene.onEnter) {
        this.currentScene.onEnter(payload);
      }
      return;
    }

    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit();
    }

    this.currentName = name;
    this.currentScene = this.scenes[name];

    if (this.currentScene.onEnter) {
      this.currentScene.onEnter(payload);
    }
  }

  update(frame) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(frame);
    }
  }

  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx);
    }
  }

  handleTouchStart(touch) {
    if (this.currentScene && this.currentScene.handleTouchStart) {
      this.currentScene.handleTouchStart(touch);
    }
  }

  handleTouchEnd(touch) {
    if (this.currentScene && this.currentScene.handleTouchEnd) {
      this.currentScene.handleTouchEnd(touch);
    }
  }
}
