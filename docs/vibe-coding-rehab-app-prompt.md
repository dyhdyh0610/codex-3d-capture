# 上肢康复 App 原型 Vibe Coding 开发提示词

## 1. 项目概述

请在当前 `D:\Codex 3D Capture` 项目中新增一个解耦的上肢康复 App Web 原型。原有 3D Capture 功能必须保持独立不变，新增 App 作为额外页面/模块存在，用于读取 3D Capture 保存的上肢坐标数据，并将其转化为患者可理解的训练报告和运动轨迹回放。

本项目用于毕业设计答辩演示，核心目标不是完整商业化上线，而是展示从摄像头上肢动作捕捉到康复 App 数据反馈的闭环：

1. 3D Capture 完成上肢动作捕捉并保存 JSON。
2. App 打开后通过接口自动读取最新一次捕捉数据。
3. App 将肩、肘、腕、手部关键点坐标转化为训练报告、运动轨迹和部位反馈。
4. 用户可以在移动端 App 风格界面中查看训练情况。

## 2. 目标用户

首版 demo 的主要目标用户是毕业设计答辩评审者和演示观看者。产品叙事中的直接使用者是上肢康复患者。

患者在完成一次上肢康复训练后，可以打开 App 查看本次训练表现，包括训练时长、综合评分、关键部位状态、运动轨迹和回放过程。

## 3. 核心痛点

上肢康复训练完成后，患者通常只能依赖主观感受判断动作完成情况，缺少直观、可回看的数据反馈。本 demo 需要解决的问题是：将 3D Capture 捕捉到的上肢关键点坐标自动接入康复 App，并以清晰的图表、评分、部位反馈和轨迹回放呈现出来。

## 4. 产品价值

产品价值主线是“3D Capture 数据闭环”。

具体表达为：

- 让上肢康复训练从主观感受转化为可视化数据反馈。
- 让患者看懂自己的训练结果，包括轨迹、活动范围、左右侧表现和部位状态。
- 展示摄像头动作采集技术在上肢康复场景中的应用价值。
- 强调低成本、无穿戴设备，仅通过浏览器和摄像头完成动作采集与反馈。

## 5. 平台与技术边界

### 5.1 平台

- 以 Web 页面形式呈现移动 App 原型。
- 页面视觉模拟 iPhone App，不需要真正打包为 iOS/Android App。
- 首版优先保证在桌面浏览器中演示稳定，界面宽度按移动端设备比例设计。

### 5.2 技术栈

采用当前项目已有技术栈：

- 原生 HTML
- 原生 CSS
- 原生 JavaScript ES Modules
- Three.js 用于轨迹/骨架回放可视化
- 当前 Node 本地服务继续负责静态资源和 API

不要引入 React、Vue、Next.js 等新框架。原因是当前 3D Capture 项目已经是原生 Web + Three.js，首版 demo 更重视轻量、稳定和与现有数据结构兼容。

### 5.3 工程边界

必须保留原 3D Capture 项目独立不变。

建议新增 App 相关文件，例如：

- `app/index.html`
- `app/styles.css`
- `app/app.js`
- `app/report.js`
- `app/replay.js`
- `app/data.js`

或使用类似清晰目录结构。不要把康复 App 逻辑混入现有 `src/app.js` 的捕捉主流程中。

服务端可以新增只读接口，例如 `/api/captures/latest`，用于读取 `captures/` 目录中最新一次 JSON。该接口是 3D Capture 与 App 的数据互通边界。

## 6. 现有数据结构说明

当前 3D Capture 保存的 JSON 文件位于：

```text
captures/<session-id>.json
```

已确认的数据结构包括：

```json
{
  "schemaVersion": "upper-body-motion-capture/v1",
  "sessionId": "cap_20260507_170609_698",
  "startedAt": "2026-05-07T09:06:09.698Z",
  "endedAt": "2026-05-07T09:15:33.076Z",
  "durationMs": 563378,
  "sampleIntervalMs": 1000,
  "coordinateSystem": {},
  "trackedNodes": [],
  "metadata": {},
  "samples": [
    {
      "capturedAt": "2026-05-07T09:06:11.713Z",
      "elapsedMs": 2015,
      "nodes": {
        "pose.left_shoulder": {
          "kind": "pose",
          "label": "Left Shoulder",
          "side": "left",
          "joint": "shoulder",
          "x": 0.1909,
          "y": -0.4231,
          "z": -0.0889,
          "visibility": 0.9900,
          "source": "poseWorld"
        }
      }
    }
  ]
}
```

关键点包括：

- 肩部：`pose.left_shoulder`、`pose.right_shoulder`
- 肘部：`pose.left_elbow`、`pose.right_elbow`
- 腕部：`pose.left_wrist`、`pose.right_wrist`
- 手部：`hand.left.*`、`hand.right.*`，包括 wrist、thumb、index、middle、ring、pinky 等关键点

App 首版至少使用肩、肘、腕三个部位数据完成骨架和轨迹展示；若手部数据存在，则在报告中显示手部活动状态和采样覆盖情况。

## 7. 核心功能规格

### 7.1 自动读取最新捕捉数据

新增接口：

```http
GET /api/captures/latest
```

接口行为：

- 扫描 `captures/` 目录。
- 忽略 `.gitkeep` 和非 JSON 文件。
- 按文件修改时间或会话结束时间选择最新一次捕捉结果。
- 返回完整 capture JSON。
- 若无捕捉数据，返回明确空状态，例如 `{ "capture": null, "error": "No capture files found" }`。

App 启动时自动调用该接口，不需要用户手动上传 JSON。

### 7.2 首页

首页需要贴近用户提供的高保真图第一屏风格。

展示内容：

- 顶部标题：`上肢康复`
- 问候语：`上午好，康复者`
- 最新数据状态卡片：显示“已连接最新训练数据”或“暂无训练数据”
- 上肢状态概览卡片：展示简化上肢骨架和橙色关键节点
- 部位状态：肩部、肘部、腕部、手部
- 主按钮：`查看本次报告`
- 今日训练摘要：训练时长、采样点数量、平均活动度

交互：

- 点击 `查看本次报告` 跳转到训练记录 Tab 中的本次报告区域，或打开报告详情视图。
- 若没有数据，按钮置灰，并提示先完成一次 3D Capture。

### 7.3 训练记录

训练记录 Tab 是核心数据展示入口。

展示内容：

- 顶部标题：`训练记录`
- 筛选标签：`全部`、`本周`、`本月`
- 能力趋势卡片：使用简洁折线图展示模拟趋势或基于当前数据生成的活动度趋势
- 最新训练卡片：显示本次捕捉的训练时长、完成时间、综合评分
- 历史训练列表：可展示当前最新数据 + 若干模拟历史记录，模拟数据应明确用于 UI 展示，不影响最新捕捉数据

点击最新训练卡片进入或展开“本次训练报告”。

### 7.4 本次训练报告

本次训练报告是核心功能之一。

报告内容：

- 训练名称：`本次上肢训练报告`
- 数据来源：最新 capture 文件名或 sessionId
- 训练时长：由 `durationMs` 转换为分钟和秒
- 采样频率：由 `sampleIntervalMs` 显示，例如 `1 秒/次`
- 有效采样点：统计 `samples` 中 `nodes` 非空的帧数
- 综合评分：基于活动范围、数据完整度、左右侧参与度生成 0-100 分
- 部位反馈：
  - 肩部：活动范围、稳定性、是否需要继续练习
  - 肘部：屈伸幅度、轨迹连续性
  - 腕部：参与度、末端轨迹变化
  - 手部：若有 hand landmarks，显示手部捕捉覆盖；若无，显示“本次主要记录上肢姿态”

评分算法可以先采用启发式计算，必须稳定可解释：

- 数据完整度：有效帧数 / 总帧数
- 活动范围：关键点 x/y/z 最大最小值差值
- 左右侧参与度：左右肩、肘、腕是否均有数据
- 综合评分：以上指标加权换算到 0-100

避免声称具备医学诊断能力。文案使用“训练反馈”“状态参考”“建议继续训练”，不要写“诊断”“治疗结论”。

### 7.5 运动轨迹回放

运动轨迹回放是核心功能之一。

展示内容：

- 3D 或伪 3D 上肢骨架视图
- 肩、肘、腕关键点
- 左右侧连线：肩到肘、肘到腕
- 轨迹尾迹：显示腕部或肘部随时间移动的橙色轨迹
- 时间轴 Slider
- 播放/暂停按钮
- 当前时间、当前帧、当前关键点数量

交互：

- 点击播放后按样本顺序回放。
- 点击暂停后停在当前帧。
- 拖动时间轴可以跳转到任意采样帧。
- 若某一帧没有有效节点，跳过或显示“该帧未检测到有效上肢数据”。

视觉要求：

- 轨迹区域可以使用 Three.js 渲染。
- 背景保持浅色，不使用复杂深色科技风。
- 关键点使用橙色圆点，骨架线条使用浅橙或灰色。

### 7.6 康复内容

康复内容 Tab 用于让原型完整，贴近高保真图。

展示内容：

- 顶部标题：`康复内容`
- 分类标签：`肩部`、`肘部`、`腕部`、`手部`
- 课程卡片：
  - 肩关节活动度训练
  - 肩部肌力强化
  - 腕部灵活练习
  - 手部抓握指导

每张卡片展示：

- 简洁插图或渐变占位图
- 训练时长
- 内容类型：视频/图文
- 简短说明
- 播放图标

课程内容可以是静态模拟数据，不需要真正播放视频。

### 7.7 我的

我的 Tab 用于完整呈现 App 原型结构。

展示内容：

- 用户信息卡片：头像、名称 `康复者`、会员/身份标签
- 设备状态：`设备已连接` 或 `已连接本地 3D Capture 数据`
- 设置列表：
  - 设备连接
  - 提醒设置
  - 账户与隐私
  - 帮助中心
  - 关于我们

## 8. UI/UX 指导

### 8.1 总体风格

参考用户提供的高保真图，同时结合 Apple 风格的简洁化表达。

关键词：

- 白底
- 橙色主色
- 轻量卡片
- 大留白
- 圆角但不过度
- 层级清晰
- 移动端 App 感

主色建议：

```css
:root {
  --color-primary: #ff6a18;
  --color-primary-soft: #fff1e8;
  --color-text: #1d1d1f;
  --color-muted: #8a8a8e;
  --color-border: #eeeeef;
  --color-bg: #f7f7f8;
  --color-card: #ffffff;
}
```

### 8.2 布局

- 页面外层居中显示一个 iPhone 风格容器。
- 容器宽度建议 390px 左右，最大宽度不超过 430px。
- 底部固定 4 Tab 导航：首页、训练记录、康复内容、我的。
- 内容区域使用卡片组合，卡片圆角建议 14-18px。
- 不要使用过重阴影，采用浅阴影或边框体现层次。

### 8.3 图标与视觉元素

- 按钮、Tab、设置项使用简洁线性图标。
- 如果不引入图标库，可以用 CSS/Unicode/简化 SVG，但整体要统一。
- 上肢骨架示意要成为首页和轨迹页的重要视觉元素。
- 橙色只用于重点按钮、选中状态、关键节点、评分强调。

### 8.4 文案风格

文案应面向患者，清晰、温和、可理解。

推荐文案：

- `本次训练表现良好`
- `肩部活动范围稳定`
- `肘部屈伸轨迹连续`
- `腕部参与度较高`
- `建议保持当前训练节奏`

避免文案：

- `诊断结果`
- `治疗结论`
- `医学判定`
- `病情改善`

## 9. 数据处理建议

### 9.1 最新训练摘要

从 capture JSON 生成以下 UI 数据：

| UI 字段 | 来源 | 说明 |
| --- | --- | --- |
| sessionId | `capture.sessionId` | 用作训练编号 |
| 训练时长 | `durationMs` | 转为分钟/秒 |
| 采样间隔 | `sampleIntervalMs` | 显示采样频率 |
| 总采样点 | `samples.length` | 总帧数 |
| 有效采样点 | `samples.filter(nodes 非空)` | 用于数据完整度 |
| 关键点数量 | 每帧 `Object.keys(nodes).length` | 用于当前帧展示 |
| 部位覆盖 | key 中是否包含 shoulder/elbow/wrist/hand | 用于部位反馈 |

### 9.2 活动范围计算

对每个部位选取对应关键点，计算 x/y/z 的最大最小差值。

示例：

- 肩部：左右肩
- 肘部：左右肘
- 腕部：左右腕
- 手部：左右手 wrist 或指尖点

活动范围可以用以下方式简化：

```text
range = sqrt((maxX-minX)^2 + (maxY-minY)^2 + (maxZ-minZ)^2)
```

然后映射为百分比或状态：

- 0-30：活动较少
- 31-70：活动正常
- 71-100：活动充分

### 9.3 综合评分

首版可采用可解释启发式：

```text
综合评分 = 数据完整度 * 35 + 活动范围评分 * 40 + 左右侧参与度 * 25
```

最终限制在 0-100。

评分用于 demo 展示，不作为医学评估结论。

## 10. 异常与空状态

必须处理以下情况：

- `captures/` 目录没有 JSON：App 显示空状态，引导先完成一次 3D Capture。
- 最新 JSON 解析失败：显示“最新训练数据读取失败”。
- `samples` 为空：报告显示“暂无有效采样点”。
- 某些帧 `nodes` 为空：轨迹回放跳过或提示该帧无有效数据。
- 手部数据缺失：手部反馈显示“本次未检测到完整手部关键点，已基于肩肘腕生成报告”。

## 11. 适合 Codex 的实现步骤

请按以下步骤实现，不要一次性重写整个项目。

### Step 1：新增最新捕捉数据接口

在服务端新增：

```http
GET /api/captures/latest
```

要求：

- 只读，不改写 capture 文件。
- 返回最新 JSON 和文件元信息。
- 保持现有 `/api/captures` 保存接口不变。
- 补充必要测试，验证无文件、有文件、非 JSON 文件、最新文件选择逻辑。

### Step 2：新增 App 静态页面入口

新增独立 App 页面，例如：

```text
/app/
```

或：

```text
/rehab-app/
```

要求：

- 不影响原首页 `/` 的 3D Capture 功能。
- 服务端允许访问新增 App 静态资源。
- App 页面自动请求 `/api/captures/latest`。

### Step 3：实现 4 Tab 移动端 UI

实现底部 4 Tab：

- 首页
- 训练记录
- 康复内容
- 我的

要求：

- 默认进入首页。
- Tab 切换不刷新页面。
- 样式贴近用户提供的高保真图。
- 使用白橙配色和 Apple 简洁风格。

### Step 4：实现训练报告数据转换

新增数据转换模块：

- 解析 capture JSON
- 统计训练时长、采样点、有效帧、部位覆盖
- 计算综合评分
- 生成肩/肘/腕/手部反馈文案

### Step 5：实现运动轨迹回放

使用 Three.js 或 Canvas 实现回放视图。

最低要求：

- 能展示肩、肘、腕骨架连线。
- 能按时间轴播放样本。
- 能暂停和拖动进度。
- 能显示当前帧关键点数量。

### Step 6：补充空状态和演示稳定性

确保无数据、坏数据、部分数据缺失时页面不会崩溃。

### Step 7：验证

至少完成：

- `npm test`
- 打开原 3D Capture 页面确认仍可访问。
- 打开新增 App 页面确认能读取最新 capture 数据。
- 验证 4 个 Tab 可切换。
- 验证报告页和轨迹回放页可展示真实捕捉数据。

## 12. 适合 v0 的 UI 提示词

如果需要用 v0 先生成 UI，可使用以下提示词：

```text
Create a mobile iOS-style rehabilitation app prototype for upper limb recovery. The app should use a white and orange color palette, soft cards, clean Apple-inspired spacing, and a bottom tab bar with four tabs: Home, Training Records, Rehab Content, and Profile.

The Home screen should show an upper limb status overview with a simple arm skeleton illustration, orange joint nodes, shoulder/elbow/wrist/hand scores, a primary orange button to view the latest report, and a daily training summary.

The Training Records screen should show a trend card, a latest training report card, and a list of previous training records. The latest report should include training duration, valid sample count, overall score, and body-part feedback.

The app must include a motion trajectory replay view. It should show an upper body skeleton with shoulders, elbows, and wrists, orange trajectory trails, a play/pause button, a timeline slider, current frame info, and concise training metrics.

The Rehab Content screen should show category tabs for shoulder, elbow, wrist, and hand, with clean course cards.

The Profile screen should show a user card, device/data connection status, and settings list.

Design style: Chinese mobile app UI, Apple-inspired simplicity, white background, orange primary color, soft shadows, rounded cards, clear hierarchy, professional rehabilitation context, no medical diagnosis claims.
```

## 13. Codex 总提示词

```text
你正在当前项目 D:\Codex 3D Capture 中工作。请保留现有 3D Capture 功能独立不变，在新分支 codex/rehab-app-prototype 上新增一个解耦的上肢康复 App Web 原型。

现有项目已经可以通过浏览器摄像头捕捉上肢动作，并将 capture JSON 保存到 captures/ 目录。新增 App 需要通过 GET /api/captures/latest 自动读取最新一次捕捉结果，不需要用户手动上传。

技术栈沿用当前项目：原生 HTML、CSS、JavaScript ES Modules、Three.js、Node 本地服务。不要引入 React/Vue/Next.js。

新增 App 以移动端 iOS 风格 Web 原型呈现，视觉参考用户提供的高保真图，结合 Apple 简洁风格，白底橙色主色，底部 4 个 Tab：首页、训练记录、康复内容、我的。

核心功能：
1. 本次训练报告：基于最新 capture JSON 展示训练时长、采样间隔、总采样点、有效采样点、综合评分、肩/肘/腕/手部反馈。
2. 运动轨迹回放：基于 samples[].nodes 按时间轴回放肩、肘、腕关键点骨架和轨迹，支持播放、暂停、拖动时间轴、显示当前帧指标。
3. 自动数据接入：App 启动后调用 /api/captures/latest，读取 captures/ 下最新 JSON，并处理无数据、坏数据、部分帧 nodes 为空等状态。
4. 完整 4 Tab 原型：首页做状态概览，训练记录承载报告和轨迹入口，康复内容展示静态训练课程，我的展示设备/数据连接状态和设置入口。

工程要求：
- 不要破坏原首页 / 的 3D Capture 捕捉流程。
- App 新增为独立路径，例如 /app/ 或 /rehab-app/。
- 服务端新增只读接口 /api/captures/latest。
- 数据处理逻辑封装为独立模块，避免把 UI 与评分计算混在一起。
- 评分算法采用可解释启发式，不声称医学诊断能力。
- 补充或更新测试，至少覆盖 latest capture 接口和基础数据转换。
- 完成后运行 npm test，并说明如何访问原 3D Capture 页面和新增 App 页面。
```

## 14. 待确认项

以下内容不会阻塞首版 demo，但后续可以继续明确：

1. 是否需要在 App 中提供从康复 App 跳转到 3D Capture 的入口。
2. 是否需要展示多个真实 capture 文件形成完整历史记录。
3. 轨迹回放优先使用 Three.js 3D 视图，还是使用更贴近移动端卡片的 2D 简化骨架视图。
4. 是否需要为答辩准备一组固定演示数据，避免现场无 capture 文件时无法展示。
