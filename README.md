# dsh-sticky-notes 📝

[English](#english) | [中文](#中文)

---

## English

Sticky notes plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Record anything anytime, right inside DSH.

### Features

- 🎨 **Three color labels** — each with a specific purpose:
  - 🔴 **Red (Urgent / 急)** — tasks and notifications; auto-pops a time picker after adding
  - 🔵 **Blue (Normal / 常)** — everyday reminders, saved instantly
  - 🟡 **Yellow (Important / 重)** — password-protected notes; content hidden until the correct 3-digit PIN is entered
- ⏰ **Timed reminders** — set a future reminder; bell animation + sound when it fires
- 📌 **Pin to top** — keep important notes visible
- 🔒 **Two-layer password protection**:
  - **Warehouse password** — required every time you enter the notes warehouse (Settings → Sticky Notes); a one-time 3-digit PIN saved in browser localStorage
  - **Per-note password** — each yellow note has its own 3-digit PIN; others can't read the content
- 🖱️ **Draggable popup** — position persists across close/reopen
- ⚡ **Zero-latency** — local optimistic updates, no visible delay when adding/editing

### Install

```sh
dsh plugin --profile web add dsh-sticky-notes
```

Then refresh your browser page. No restart needed.

### Usage

1. Click the 📝 button in the **composer tool row** (left side, next to the + button)
2. The sticky notes popup opens — type a note and press Enter or click "Add"
3. Pick a color: 🔴 Red / 🔵 Blue / 🟡 Yellow
4. Red notes prompt for a reminder time; Yellow notes prompt for a 3-digit PIN
5. View all notes in **Settings → 📝 泡泡猫的即时便签**

### Architecture

- **Host**: HTTP API at `/api/paopaocat-notes` (via `webServer.register`), data persisted to `/dsh/paopaocat-notes.json`
- **Client**: React components in `__ModuleLoader__` bundle, UI registered via `slots.inject`
- Compatible with both Web and Desktop DSH profiles

### License

MIT

---

## 中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的便签插件。随时记录，打开即用。

### 功能特点

- 🎨 **三种彩色标签** — 每种有特定用途：
  - 🔴 **红色（急）** — 通知和任务；添加后自动弹出时间选择器
  - 🔵 **蓝色（常）** — 平常提醒，即刻保存
  - 🟡 **黄色（重）** — 密码保护的便签；输入正确三位数密码才能查看内容
- ⏰ **定时提醒** — 设置未来时间提醒；到时间后铃铛动画 + 蜂鸣音
- 📌 **置顶** — 重要便签置顶显示
- 🔒 **双层密码保护**：
  - **库房密码** — 每次进入设置页面的便签库房时需要输入，三位数 PIN 码保存在浏览器 localStorage 中
  - **单条密码** — 每条黄色便签有独立的三位数密码，别人看不到内容
- 🖱️ **可拖拽弹窗** — 位置跨次关闭/打开保持
- ⚡ **零延迟** — 本地乐观更新，添加便签无感知延迟

### 安装

```sh
dsh plugin --profile web add dsh-sticky-notes
```

安装后刷新浏览器页面即可，无需重启。

### 使用方法

1. 点击对话框工具栏左侧的 📝 按钮
2. 弹出便签窗口 — 输入内容后按回车或点击"添加"
3. 选择颜色：🔴 红色 / 🔵 蓝色 / 🟡 黄色
4. 红色便签自动弹出时间选择器设置提醒；黄色便签自动弹出密码设置
5. 在 **设置 → 📝 泡泡猫的即时便签** 查看所有便签

### 技术架构

- **Host 端**：HTTP API `/api/paopaocat-notes`（通过 `webServer.register` 注册），数据持久化到 `/dsh/paopaocat-notes.json`
- **Client 端**：`__ModuleLoader__` 格式的 React 组件，UI 通过 `slots.inject` 注册
- 兼容 Web 和 Desktop 版 DSH

### 许可证

MIT
