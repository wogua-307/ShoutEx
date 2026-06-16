# 输出全靠吼原生微信小游戏迁移执行文档

## 1. 目标

将参考项目 `/Users/modao/WeChatProjects/输出全靠吼` 的玩法、交互和视觉方向迁移到当前项目 `/Users/modao/WeChatProjects/ShoutEx`，实现一个原生微信小游戏版的声控游戏合集。

本次迁移必须满足：

- 不将 React 项目打包后塞入当前项目。
- 不使用 WebView 承载 H5。
- 不引入 React、React DOM、Tailwind、Vite、lucide-react、motion 等前端依赖。
- 使用微信小游戏原生能力：`game.js`、Canvas、`wx` API、触摸事件、录音 API、本地存储。
- 参考前端项目的玩法规则、状态流转、文案和交互节奏，在小游戏环境中重新实现。

当前项目已经是微信小游戏工程：

- `project.config.json` 中 `compileType` 为 `game`
- 入口文件为 `game.js`
- Canvas 初始化在 `js/render.js`
- 主循环在 `js/main.js`

因此执行方向是“微信小游戏原生 Canvas 重写”，不是普通小程序页面 `wxml/wxss` 改造。

## 2. 可行性结论

可行。

参考项目的核心玩法都属于轻量 2D 状态机，适合迁移到小游戏 Canvas：

- 菜单选择
- 麦克风授权
- 实时音量条
- 5 个声控小游戏
- 开始页、游玩中、结算页
- 历史最高分

需要重写的部分主要有三类：

| 参考项目能力 | Web 实现 | 小游戏迁移方式 |
| --- | --- | --- |
| UI | React 组件 + Tailwind class | Canvas 绘制按钮、面板、HUD、文字 |
| 动画 | CSS transition / animation | `requestAnimationFrame` + 数值插值 |
| 麦克风 | `navigator.mediaDevices` + `AudioContext` | `wx.getRecorderManager()` + PCM/RMS 音量计算 |

最大技术风险是小游戏内实时麦克风音量采样。该能力需要真机验证，开发者工具仅作为初步检查环境。

## 3. 迁移边界

### 3.1 保留

- 微信小游戏工程形态。
- `game.js` 入口。
- `game.json` 竖屏配置。
- `js/render.js` 中 Canvas 初始化方式，必要时扩展安全区和 DPR 信息。
- `js/libs/tinyemitter.js` 可继续作为事件工具。

### 3.2 替换

当前项目是飞机大战示例，需要替换运行逻辑：

- `js/main.js`：从飞机大战主循环改为声控游戏合集主循环。
- `js/runtime/gameinfo.js`：不再作为唯一 UI 层，改为场景内 Canvas UI。
- `js/runtime/music.js`：按需保留或简化为统一音效管理。
- `js/databus.js`：从飞机大战状态管理改为更通用状态，或废弃不用。

### 3.3 暂不删除

第一阶段不删除旧文件和旧资源，避免迁移过程中丢失可回退入口。等新主循环、菜单和至少一个玩法稳定后，再清理：

- `js/player/*`
- `js/npc/*`
- `images/hero.png`
- `images/enemy.png`
- `images/bullet.png`
- `images/explosion*.png`
- `images/bg.jpg`
- 旧飞机大战音效

## 4. 目标架构

建议新增目录结构：

```text
js
├── assets
│   └── pixel-sprites.js
├── core
│   ├── constants.js
│   ├── input.js
│   ├── scene-manager.js
│   ├── storage.js
│   └── timing.js
├── scenes
│   ├── menu.js
│   ├── scream-bird.js
│   ├── sprint-game.js
│   ├── rocket-game.js
│   ├── punch-game.js
│   └── mage-game.js
├── services
│   └── audio-level.js
├── ui
│   └── pixel-ui.js
├── render.js
└── main.js
```

### 4.1 `js/main.js`

职责：

- 创建全局服务。
- 初始化音频服务、输入服务、场景管理器。
- 注册触摸事件。
- 驱动统一游戏循环。
- 每帧清屏、更新、渲染。

主循环形态：

```js
loop(time) {
  const dt = timing.tick(time);
  audioLevel.update(dt);
  sceneManager.update(dt, audioLevel.getState());
  sceneManager.render(ctx);
  requestAnimationFrame(loop);
}
```

### 4.2 `js/core/scene-manager.js`

职责：

- 管理当前场景。
- 提供 `goTo(sceneName, payload)`。
- 把触摸事件转发给当前场景。
- 提供统一 `update(dt, services)` 和 `render(ctx)`。

建议场景名：

```js
MENU
SCREAM_BIRD
SPRINT
ROCKET
PUNCH
MAGE
```

### 4.3 `js/services/audio-level.js`

职责：

- 处理麦克风授权。
- 启停录音。
- 读取录音帧。
- 从 PCM 数据计算 RMS 音量。
- 平滑输出 `level: 0-100`。
- 暴露权限状态和错误状态。

建议状态：

```js
{
  level: 0,
  rawLevel: 0,
  isRecording: false,
  permission: 'unknown' | 'granted' | 'denied',
  error: ''
}
```

### 4.4 `js/ui/pixel-ui.js`

职责：

- 绘制像素风按钮。
- 绘制面板。
- 绘制音量条。
- 绘制 HUD。
- 绘制结算卡片。
- 绘制像素描边文字。
- 管理点击热区。

所有交互控件要满足：

- 触摸热区不小于 44px 高。
- 点击后 80-150ms 内有视觉反馈。
- 文案不贴边，左右至少 12px 内边距。
- 不靠颜色单独表达状态，关键状态同时使用文字或形状。

### 4.5 `js/assets/pixel-sprites.js`

职责：

- 用 Canvas 代码绘制像素角色和图标。
- 不依赖 emoji 作为结构图标。
- 初版优先代码绘制，降低切图成本。

建议提供：

```js
drawPixelBird(ctx, x, y, size, options)
drawPixelCar(ctx, x, y, size, options)
drawPixelRocket(ctx, x, y, size, options)
drawPixelSandbag(ctx, x, y, size, options)
drawPixelMage(ctx, x, y, size, options)
drawPixelSlime(ctx, x, y, size, options)
drawPixelMic(ctx, x, y, size, options)
drawPixelBack(ctx, x, y, size, options)
```

## 5. 音频采样方案

### 5.1 目标

把用户声音转成稳定的 `0-100` 音量值，作为所有玩法的统一输入。

### 5.2 推荐实现

优先使用微信录音管理器：

```js
const recorder = wx.getRecorderManager();

recorder.start({
  duration: 600000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'pcm',
  frameSize: 4
});

recorder.onFrameRecorded(({ frameBuffer }) => {
  // 解析 PCM，计算 RMS
});
```

音量计算：

```js
function calcRmsLevel(frameBuffer) {
  const view = new DataView(frameBuffer);
  let sum = 0;
  const count = Math.floor(frameBuffer.byteLength / 2);

  for (let i = 0; i < count; i += 1) {
    const sample = view.getInt16(i * 2, true) / 32768;
    sum += sample * sample;
  }

  const rms = Math.sqrt(sum / Math.max(1, count));
  return Math.min(100, Math.round(rms * 400));
}
```

平滑策略：

```js
smoothed = previous * 0.78 + raw * 0.22;
```

可选增强：

- 噪声门限：`raw < 3` 视为 0。
- 峰值保持：用于火箭、伤害类玩法。
- 自动校准：进入游戏前采样 0.5 秒环境噪音，作为基准扣除。

### 5.3 授权流程

启动页或菜单页显示“开启麦克风”按钮。

点击后：

1. 调用 `wx.authorize({ scope: 'scope.record' })`。
2. 成功后启动录音。
3. 失败则显示权限提示。
4. 用户拒绝后，提供“去设置开启”按钮，调用 `wx.openSetting()`。

错误提示必须说明恢复方式：

- “未获得麦克风权限，无法声控。请在设置中开启麦克风后重试。”
- “当前环境暂不支持实时录音帧，请使用真机预览测试。”

### 5.4 风险和验证

风险：

- 开发者工具录音帧行为可能与真机不同。
- 不同机型麦克风增益不同。
- 环境噪音会影响低音量玩法。
- 长时间录音可能被系统中断。

验证：

- iPhone 真机。
- Android 真机。
- 安静环境。
- 嘈杂环境。
- 拒绝权限后再开启权限。
- 切后台再回前台。

## 6. 视觉和交互规范

使用 `ui-ux-pro-max` 的移动端交互原则，并结合本项目自定义 Pixel Arcade 风格。

### 6.1 风格定位

关键词：

- 像素街机
- 声控派对
- 深色高对比
- 鲜艳强调色
- 方块化 UI
- 快速反馈

整体观感：

- 背景深色，不使用大面积单一紫蓝渐变。
- 角色、按钮、面板采用硬边像素块。
- 按钮使用粗边框和 2-4px 视觉偏移表达按下。
- HUD 数字使用等宽或系统粗体，保持稳定宽度。

### 6.2 颜色 token

建议定义在 `js/core/constants.js`：

```js
COLORS = {
  bg: '#111827',
  bgDeep: '#070B14',
  panel: '#1F2937',
  panelDark: '#111827',
  text: '#F9FAFB',
  textMuted: '#A7B0C0',
  border: '#F9FAFB',
  shadow: '#000000',
  orange: '#F97316',
  cyan: '#22D3EE',
  rose: '#F43F5E',
  blue: '#3B82F6',
  purple: '#A855F7',
  green: '#22C55E',
  yellow: '#FACC15',
  red: '#EF4444'
}
```

每个玩法保留参考项目的主色：

| 玩法 | 主色 |
| --- | --- |
| 尖叫小鸟 | 橙色 |
| 十秒狂飙 | 青色 |
| 声波火箭 | 玫红 |
| 分贝发泄馆 | 蓝色 |
| 言出法随小法师 | 紫色 |

### 6.3 布局

小游戏竖屏优先。

通用安全区：

- 顶部 HUD 避开状态栏和刘海。
- 底部按钮避开手势条。
- 横向边距 16px。
- 面板内边距 16px 或 24px。
- 元素间距使用 4/8px 节奏。

菜单页建议结构：

```text
顶部：标题 + 麦克风状态
中部：实时音量条 + 授权提示
主体：5 个玩法入口卡片
底部：说明/版本/调试音量值
```

### 6.4 触摸和反馈

- 所有按钮点击区域至少 44px 高。
- 点击后按钮下沉 2px 或改变填充色。
- 禁用态降低对比，同时文案说明原因。
- 返回按钮固定在游戏内左上角或左下角，避免隐藏。
- 游戏开始按钮必须是当前屏幕唯一主行动作。

### 6.5 文案

保留参考项目主要文案，但小游戏内要更短：

- “开启麦克风”
- “麦克风已开启”
- “开始挑战”
- “返回大厅”
- “再来一局”
- “本次得分”
- “历史最高”

避免在屏幕上堆叠长说明。长规则改为 2 行以内。

## 7. 玩法迁移设计

### 7.1 菜单场景 `menu.js`

状态：

```js
{
  selectedGame: null,
  buttons: [],
  micButton: Rect,
  gameCards: Rect[]
}
```

行为：

- 展示标题“输出全靠吼”。
- 展示麦克风状态和实时音量条。
- 展示 5 个玩法入口。
- 点击玩法时，如果未授权麦克风，先触发授权；授权成功后进入玩法。
- 点击已授权玩法，直接进入对应场景。

玩法卡片：

| key | 标题 | 副文案 |
| --- | --- | --- |
| `SCREAM_BIRD` | 尖叫小鸟 | 大声向上飞，安静往下落 |
| `SPRINT` | 十秒狂飙 | 10 秒内吼得越稳跑得越远 |
| `ROCKET` | 声波火箭 | 3 秒蓄力，用峰值发射 |
| `PUNCH` | 分贝发泄馆 | 5 秒爆发，打出最高伤害 |
| `MAGE` | 言出法随小法师 | 音量越大，法术越狠 |

### 7.2 尖叫小鸟 `scream-bird.js`

参考文件：

- `/Users/modao/WeChatProjects/输出全靠吼/src/games/ScreamBird.tsx`
- `/Users/modao/WeChatProjects/输出全靠吼/src/hooks/useGameEngine.ts`

状态：

```js
{
  phase: 'START' | 'PLAYING' | 'GAMEOVER',
  birdY: 0,
  velocity: 0,
  pipes: [],
  score: 0,
  highScore: 0
}
```

规则：

- 鸟固定在屏幕 x = 25%。
- 音量大于 15 时产生向上力。
- 重力持续向下。
- 管道从右向左移动。
- 穿过管道加 1 分。
- 撞管道、碰到顶部或底部时游戏结束。

建议参数：

```js
GRAVITY = 900
LIFT = 18
MAX_FALL_SPEED = 900
PIPE_SPEED = 180
PIPE_GAP = screenHeight * 0.32
PIPE_INTERVAL = 1.8
```

渲染：

- 天空背景用块状色带。
- 管道用绿色像素矩形。
- 鸟用橙色像素图形。
- 音量超过 40 时在鸟嘴前绘制声波块。

### 7.3 十秒狂飙 `sprint-game.js`

参考文件：

- `/Users/modao/WeChatProjects/输出全靠吼/src/games/SprintGame.tsx`

状态：

```js
{
  phase: 'START' | 'PLAYING' | 'GAMEOVER',
  timeLeft: 10,
  distance: 0,
  speed: 0,
  highScore: 0,
  roadOffset: 0
}
```

规则：

- 游戏时长 10 秒。
- 音量大于 15 才产生速度。
- 距离随速度增长。
- 时间归零结算。

速度公式参考：

```js
if (level > 15) {
  targetSpeed = 10 + (level - 15) * 1.5;
}
distance += targetSpeed * dt * 5;
```

渲染：

- 底部赛道。
- 像素小车。
- 路面虚线根据 `roadOffset` 滚动。
- 顶部显示倒计时和距离。
- 底部显示速度条。

### 7.4 声波火箭 `rocket-game.js`

参考文件：

- `/Users/modao/WeChatProjects/输出全靠吼/src/games/RocketGame.tsx`

状态：

```js
{
  phase: 'START' | 'CHARGING' | 'FLYING' | 'GAMEOVER',
  chargeLeft: 3,
  maxVolume: 0,
  altitude: 0,
  velocity: 0,
  highScore: 0
}
```

规则：

- 点击开始进入 3 秒蓄力。
- 蓄力阶段记录最高音量。
- 蓄力结束后根据最高音量计算初速度。
- 火箭上升，速度被重力衰减。
- 速度小于等于 0 时到达顶点，结算高度。

公式参考：

```js
velocity = Math.pow(maxVolume, 1.3) * 2;
velocity -= 90 * dt;
altitude += velocity * dt;
```

渲染：

- 深色太空背景。
- 蓄力时火箭抖动，火焰高度随音量变化。
- 飞行时星点向下滚动。
- 高度数字固定在顶部。

### 7.5 分贝发泄馆 `punch-game.js`

参考文件：

- `/Users/modao/WeChatProjects/输出全靠吼/src/games/PunchGame.tsx`

状态：

```js
{
  phase: 'START' | 'CHARGING' | 'ANIMATING' | 'GAMEOVER',
  timeLeft: 5,
  peak: 0,
  sum: 0,
  frames: 0,
  damage: 0,
  targetX: 0,
  beamWidth: 0,
  highScore: 0
}
```

规则：

- 5 秒内持续采集音量。
- 记录峰值和平均值。
- 时间结束计算伤害。
- 播放能量波和沙袋飞出动画。
- 动画结束显示结算。

伤害公式参考：

```js
average = frames > 0 ? sum / frames : 0;
damage = Math.floor(peak * 100 + average * 150);
```

渲染：

- 沙袋居中。
- 音量大于 30 时屏幕轻微震动。
- 音量大于 80 时沙袋裂纹增强。
- 结算页突出伤害数字。

### 7.6 言出法随小法师 `mage-game.js`

参考文件：

- `/Users/modao/WeChatProjects/输出全靠吼/src/games/MageGame.tsx`

状态：

```js
{
  phase: 'START' | 'PLAYING' | 'GAMEOVER',
  baseHp: 100,
  score: 0,
  highScore: 0,
  enemies: [],
  projectiles: [],
  lastFireTime: 0,
  lastSpawnTime: 0,
  gameTime: 0
}
```

规则：

- 敌人从右侧向左推进。
- 敌人到达基地扣血。
- 基地血量归零游戏结束。
- 音量大于 10 自动发射。
- 音量分档决定技能：
  - `10-40`：小飞弹
  - `40-70`：火球
  - `70+`：陨石
- 击败敌人加分。

渲染：

- 左侧城堡/法师基地。
- 右侧敌人推进。
- 弹体根据类型不同绘制尺寸和颜色。
- 血条和分数固定在顶部。

## 8. 存储方案

使用微信本地存储保存历史最高分。

建议 key：

```js
shoutex.highScore.screamBird
shoutex.highScore.sprint
shoutex.highScore.rocket
shoutex.highScore.punch
shoutex.highScore.mage
```

`js/core/storage.js`：

```js
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
```

## 9. 资产方案

### 9.1 第一优先：代码绘制

初版所有主要角色都用 Canvas 像素块绘制：

- 鸟
- 小车
- 火箭
- 沙袋
- 法师
- 史莱姆
- 麦克风
- 返回箭头

优点：

- 不增加包体。
- 颜色和尺寸可以程序化控制。
- 适配不同 DPR 更稳定。

### 9.2 第二优先：生成 SVG/PNG

如果代码绘制效果不够，可以在项目内生成简单 SVG 或 PNG sprite。

建议尺寸：

- `images/pixel/bird.png`：64x64，透明背景
- `images/pixel/car.png`：96x64，透明背景
- `images/pixel/rocket.png`：64x96，透明背景
- `images/pixel/sandbag.png`：96x128，透明背景
- `images/pixel/mage.png`：96x96，透明背景
- `images/pixel/slime.png`：64x64，透明背景
- `images/pixel/bg-arcade.png`：750x1334，非透明

### 9.3 需要外部 AI 生成时的提示词

如果后续需要更精致位图，使用以下提示词。

通用风格：

```text
Pixel art sprite sheet, 16-bit arcade game style, crisp hard edges, transparent background, high contrast, no blur, no antialiasing, mobile game asset, front-facing readable silhouette
```

鸟：

```text
Pixel art orange screaming bird character, round body, small wing, open beak, expressive eye, 16-bit arcade game style, transparent background, 64x64 sprite, crisp hard edges, no blur
```

赛车：

```text
Pixel art cyan arcade racing car, side view, chunky wheels, small windshield, 16-bit arcade game style, transparent background, 96x64 sprite, crisp hard edges, no blur
```

火箭：

```text
Pixel art red rocket ship, vertical launch pose, small fins, flame exhaust, 16-bit arcade game style, transparent background, 64x96 sprite, crisp hard edges, no blur
```

沙袋：

```text
Pixel art training sandbag target, dark blue gray fabric, stitched patch, impact cracks, 16-bit arcade style, transparent background, 96x128 sprite, crisp hard edges, no blur
```

法师：

```text
Pixel art tiny wizard, purple robe, glowing staff, determined face, 16-bit arcade tower defense style, transparent background, 96x96 sprite, crisp hard edges, no blur
```

史莱姆：

```text
Pixel art green slime enemy, cute but hostile, simple eyes, blob body, 16-bit arcade tower defense style, transparent background, 64x64 sprite, crisp hard edges, no blur
```

## 10. 执行阶段

### 阶段 0：基线检查

目标：确认当前工程可以在微信开发者工具以小游戏方式打开。

任务：

- 检查 `project.config.json`。
- 检查 `game.js`。
- 检查 `game.json`。
- 确认当前代码无语法错误。
- 记录当前旧飞机大战入口，便于回退。

验收：

- 开发者工具可导入当前项目。
- 当前旧游戏能正常进入或至少能编译。

### 阶段 1：基础架构

目标：建立新小游戏主循环和场景系统。

任务：

- 新增 `js/core/constants.js`。
- 新增 `js/core/timing.js`。
- 新增 `js/core/scene-manager.js`。
- 新增 `js/core/input.js`。
- 新增 `js/ui/pixel-ui.js`。
- 新增 `js/scenes/menu.js`。
- 改造 `js/main.js`。

验收：

- 进入游戏后显示新像素风菜单。
- 点击菜单按钮有视觉反馈。
- 场景切换可用。
- 没有 React/Vite/Tailwind 依赖。

### 阶段 2：麦克风音量服务

目标：实现声控输入闭环。

任务：

- 新增 `js/services/audio-level.js`。
- 菜单页接入“开启麦克风”按钮。
- 显示实时音量条。
- 实现授权失败提示和重试。
- 实现 `wx.openSetting()` 恢复入口。

验收：

- 真机点击开启麦克风后，音量条能随声音变化。
- 拒绝权限后有清晰提示。
- 开启权限后可重新采样。

### 阶段 3：迁移尖叫小鸟

目标：完成第一个可玩的声控小游戏，验证整套架构。

任务：

- 新增 `js/scenes/scream-bird.js`。
- 实现开始页、游玩页、结算页。
- 实现鸟物理、管道、碰撞、得分。
- 接入最高分存储。
- 接入返回大厅。

验收：

- 玩家能通过声音控制鸟上下。
- 管道正常生成和移动。
- 碰撞后进入结算页。
- 再来一局和返回大厅可用。

### 阶段 4：迁移十秒狂飙、声波火箭、分贝发泄馆

目标：完成三个短局玩法。

任务：

- 新增 `js/scenes/sprint-game.js`。
- 新增 `js/scenes/rocket-game.js`。
- 新增 `js/scenes/punch-game.js`。
- 每个玩法接入开始、游玩、结算、最高分。

验收：

- 十秒狂飙可以按音量增长距离并在 10 秒结算。
- 声波火箭可以 3 秒蓄力并按峰值计算高度。
- 分贝发泄馆可以 5 秒累计音量并结算伤害。

### 阶段 5：迁移言出法随小法师

目标：完成复杂度最高的塔防玩法。

任务：

- 新增 `js/scenes/mage-game.js`。
- 实现敌人生成。
- 实现音量分档发射。
- 实现碰撞和伤害。
- 实现基地血量和游戏结束。

验收：

- 敌人从右向左推进。
- 不同音量触发不同法术。
- 敌人被击败得分。
- 基地血量归零结算。

### 阶段 6：统一视觉和清理

目标：统一体验，清理旧示例痕迹。

任务：

- 统一按钮、面板、HUD、结算页。
- 统一像素角色绘制。
- 优化小屏布局。
- 检查所有触摸热区。
- 清理不再使用的飞机大战代码和资源。
- 更新 README。

验收：

- 5 个玩法视觉风格一致。
- 所有按钮在小屏上可点。
- 无旧飞机大战 UI 露出。
- 包体无明显无用资源。

## 11. 验收清单

### 11.1 功能验收

- [ ] 菜单页能显示 5 个玩法。
- [ ] 麦克风授权流程可用。
- [ ] 实时音量条可用。
- [ ] 尖叫小鸟可完整游玩。
- [ ] 十秒狂飙可完整游玩。
- [ ] 声波火箭可完整游玩。
- [ ] 分贝发泄馆可完整游玩。
- [ ] 言出法随小法师可完整游玩。
- [ ] 每个玩法都有结算页。
- [ ] 每个玩法都能返回大厅。
- [ ] 每个玩法都能再来一局。
- [ ] 历史最高分能持久化。

### 11.2 交互验收

- [ ] 主要按钮触摸热区不小于 44px。
- [ ] 点击按钮有即时反馈。
- [ ] 游戏内返回路径始终可见。
- [ ] 授权失败有恢复路径。
- [ ] 文案不溢出、不遮挡主体。
- [ ] 顶部和底部 UI 避开安全区。

### 11.3 视觉验收

- [ ] 整体为像素街机风格。
- [ ] 不使用 emoji 作为结构图标。
- [ ] 5 个玩法主色清晰区分。
- [ ] 深色背景下文字对比足够。
- [ ] HUD 数字稳定，不因位数变化明显跳动。
- [ ] 无一页被单一紫蓝色调占满。

### 11.4 性能验收

- [ ] 每帧更新逻辑控制在 16ms 以内。
- [ ] 场景内对象及时回收或复用。
- [ ] 不在每帧创建大量临时对象。
- [ ] 不在每帧重复创建图片或音频实例。
- [ ] 录音服务切后台能停止或恢复正常。

### 11.5 真机验收

- [ ] iPhone 真机可授权麦克风。
- [ ] Android 真机可授权麦克风。
- [ ] 安静环境音量接近 0。
- [ ] 大声喊叫能明显接近高值。
- [ ] 切后台再回来不崩溃。
- [ ] 拒绝权限后可通过设置恢复。

## 12. 风险和应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 开发者工具麦克风不稳定 | 无法本地完整验证 | 以真机预览为准 |
| 不同机型音量差异大 | 难度不一致 | 加环境噪音校准和音量平滑 |
| 录音授权被拒 | 用户无法游玩 | 菜单明确提示，并提供打开设置 |
| Canvas 文本在不同设备表现不同 | UI 错位 | 统一测量文本，限制每行字数 |
| 每帧对象创建过多 | 掉帧 | 使用对象池或数组复用 |
| 玩法过多导致首版延期 | 交付风险 | 先完成菜单、音频、尖叫小鸟作为 MVP |

## 13. 推荐实施顺序

最小可交付版本：

1. 新菜单。
2. 麦克风音量条。
3. 尖叫小鸟。
4. 最高分。
5. 真机验证。

完整版本：

1. 基础架构。
2. 音频服务。
3. 菜单。
4. 尖叫小鸟。
5. 十秒狂飙。
6. 声波火箭。
7. 分贝发泄馆。
8. 言出法随小法师。
9. 统一像素风。
10. 清理旧代码和资源。

## 14. 开发约束

执行迁移时必须遵守：

- 每次开始改代码前，先明确本阶段目标和涉及文件。
- 不引入 React 运行时。
- 不引入 WebView。
- 不引入 npm 构建链作为小游戏运行前置。
- 不把参考项目 `dist` 或构建产物复制进来。
- 优先使用 Canvas 绘制资产。
- 需要位图时，先生成小尺寸透明 sprite。
- 无法生成时，再提供 AI 图片提示词并等待导入。
- 保持所有新增文件 ASCII，除用户可见中文文案外不引入无关 Unicode。

## 15. 预计文件变更清单

第一轮实现可能新增：

```text
docs/native-minigame-migration-execution.md
js/core/constants.js
js/core/timing.js
js/core/input.js
js/core/scene-manager.js
js/core/storage.js
js/services/audio-level.js
js/ui/pixel-ui.js
js/assets/pixel-sprites.js
js/scenes/menu.js
js/scenes/scream-bird.js
```

第一轮可能修改：

```text
js/main.js
game.json
README.md
```

完整版本继续新增：

```text
js/scenes/sprint-game.js
js/scenes/rocket-game.js
js/scenes/punch-game.js
js/scenes/mage-game.js
```

最后清理阶段可能删除：

```text
js/player/*
js/npc/*
images/hero.png
images/enemy.png
images/bullet.png
images/explosion*.png
```

删除动作必须在新版本可运行后单独执行。
