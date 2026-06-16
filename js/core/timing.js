export default class Timing {
  constructor() {
    this.lastTime = 0;
    this.time = 0;
    this.delta = 0;
  }

  tick(time) {
    if (!this.lastTime) {
      this.lastTime = time;
    }

    this.delta = Math.min(0.05, (time - this.lastTime) / 1000);
    this.time += this.delta;
    this.lastTime = time;

    return {
      delta: this.delta,
      time: this.time,
    };
  }
}
