# ShoutEx / 输出全靠吼

原生微信小游戏版声控游戏合集。项目使用微信小游戏 Canvas 和 `wx` 原生 API 实现，不依赖 React、WebView、Vite 或 Tailwind。

## 当前玩法

- 尖叫小鸟：大声向上飞，安静往下落。
- 十秒狂飙：10 秒内持续输出，跑出最远距离。
- 声波火箭：3 秒蓄力，用最高音量发射。
- 分贝发泄馆：5 秒累计音量，打出最高伤害。
- 言出法随小法师：音量分档施法，守住基地。

## 运行方式

1. 使用微信开发者工具导入当前目录。
2. 选择小游戏项目运行。
3. 使用真机预览验证麦克风授权和实时音量。

开发者工具中的录音帧行为可能和真机不同。如果实时录音不可用，游戏会显示预览波形并提示使用真机测试。

## 源码结构

```text
├── docs
│   └── native-minigame-migration-execution.md
├── js
│   ├── assets
│   │   └── pixel-sprites.js              // Canvas 像素角色和图标绘制
│   ├── core
│   │   ├── constants.js                  // 屏幕、安全区、颜色、玩法配置
│   │   ├── scene-manager.js              // 场景切换
│   │   ├── storage.js                    // 最高分本地存储
│   │   └── timing.js                     // 帧时间
│   ├── scenes
│   │   ├── menu.js                       // 声波街机大厅
│   │   ├── scream-bird.js                // 尖叫小鸟
│   │   ├── sprint-game.js                // 十秒狂飙
│   │   ├── rocket-game.js                // 声波火箭
│   │   ├── punch-game.js                 // 分贝发泄馆
│   │   └── mage-game.js                  // 言出法随小法师
│   ├── services
│   │   └── audio-level.js                // 麦克风授权、录音帧、音量计算
│   ├── ui
│   │   └── pixel-ui.js                   // 像素风按钮、面板、音量条
│   ├── main.js                           // 游戏主入口和主循环
│   └── render.js                         // Canvas 初始化
├── game.js                               // 小游戏入口
├── game.json                             // 小游戏配置
└── project.config.json                   // 微信开发者工具项目配置
```

## 麦克风说明

音量输入使用 `wx.getRecorderManager()` 获取录音帧，并对 PCM 数据计算 RMS 音量，归一化为 `0-100`。

权限流程：

- 点击首页“开麦”按钮会申请 `scope.record`。
- 拒绝授权后，再次点击会尝试打开设置页。
- 小游戏切后台时暂停录音，回前台后按用户意图自动恢复。

## 设计方向

项目采用 Pixel Arcade 风格：

- 深色背景
- 高对比像素 UI
- 方块按钮和硬阴影
- Canvas 绘制角色图标
- 竖屏优先
