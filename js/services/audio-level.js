export default class AudioLevelService {
  constructor() {
    this.level = 0;
    this.rawLevel = 0;
    this.isRecording = false;
    this.permission = 'unknown';
    this.error = '';
    this.fakePulse = 0;
    this.recorder = null;
    this.usePreview = false;
    this.hasFrame = false;
  }

  start() {
    if (this.isRecording) {
      return Promise.resolve(true);
    }

    this.error = '';

    if (!wx.getRecorderManager) {
      this.usePreview = true;
      this.error = '当前环境暂不支持实时录音帧，请使用真机预览测试';
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const beginRecord = () => {
        this.ensureRecorder();

        try {
          this.recorder.start({
            duration: 600000,
            sampleRate: 16000,
            numberOfChannels: 1,
            encodeBitRate: 48000,
            format: 'pcm',
            frameSize: 4,
          });

          this.permission = 'granted';
          this.isRecording = true;
          this.usePreview = false;
          resolve(true);
        } catch (error) {
          this.usePreview = true;
          this.error = '麦克风启动失败，请在真机上重试';
          resolve(false);
        }
      };

      if (!wx.authorize) {
        beginRecord();
        return;
      }

      wx.authorize({
        scope: 'scope.record',
        success: beginRecord,
        fail: () => {
          this.permission = 'denied';
          this.isRecording = false;
          this.usePreview = true;
          this.error = '未获得麦克风权限，请在设置中开启后重试';
          resolve(false);
        },
      });
    });
  }

  stop() {
    if (this.recorder && this.isRecording) {
      try {
        this.recorder.stop();
      } catch (error) {
        // Recorder may already be stopped by the runtime.
      }
    }

    this.isRecording = false;
    this.level = 0;
    this.rawLevel = 0;
  }

  update(dt) {
    if (!this.isRecording || this.usePreview || !this.hasFrame) {
      this.fakePulse += dt * 4;
      const base = 28 + Math.sin(this.fakePulse) * 12 + Math.sin(this.fakePulse * 2.7) * 5;
      this.rawLevel = Math.max(0, Math.min(100, Math.round(base)));
    }

    const gated = this.rawLevel < 3 ? 0 : this.rawLevel;
    this.level = Math.round(this.level * 0.78 + gated * 0.22);
  }

  getState() {
    return {
      level: this.level,
      rawLevel: this.rawLevel,
      isRecording: this.isRecording,
      permission: this.permission,
      error: this.error,
    };
  }

  ensureRecorder() {
    if (this.recorder) {
      return;
    }

    this.recorder = wx.getRecorderManager();

    this.recorder.onFrameRecorded((result) => {
      if (!result || !result.frameBuffer) {
        return;
      }

      this.hasFrame = true;
      this.rawLevel = this.calcRmsLevel(result.frameBuffer);
    });

    this.recorder.onStop(() => {
      this.isRecording = false;
    });

    this.recorder.onError(() => {
      this.isRecording = false;
      this.usePreview = true;
      this.error = '麦克风录音中断，请重新开启';
    });
  }

  calcRmsLevel(frameBuffer) {
    const view = new DataView(frameBuffer);
    const count = Math.floor(frameBuffer.byteLength / 2);

    if (!count) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < count; i += 1) {
      const sample = view.getInt16(i * 2, true) / 32768;
      sum += sample * sample;
    }

    const rms = Math.sqrt(sum / count);
    return Math.min(100, Math.round(rms * 420));
  }
}
