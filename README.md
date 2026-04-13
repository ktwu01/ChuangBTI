# ChuangBTI 人格测试

> 从老梗 MBTI 到创圈 **ChuangBTI**：创始人向整活搞笑版，仅供娱乐。

一个开源的娱乐性人格测试项目，基于 B站UP主 [@蛆肉儿串儿](https://space.bilibili.com/417038183) 的原创测试。

Remixed by [Koutian Wu](https://ktwu01.github.io/)

## 在线体验

若已为仓库开启 GitHub Pages，可访问：**[https://ktwu01.github.io/ChuangBTI/](https://ktwu01.github.io/ChuangBTI/)**（与 `vite.config.js` 中 `base` 及部署目录一致即可）。

## 特性

- **27 种人格类型** — 25 种标准类型 + 2 种隐藏/兜底类型
- **15 个评估维度** — 自我、情感、态度、行动、社交五大模型
- **曼哈顿距离匹配** — 基于 15 维向量的匹配与相似度
- **隐藏彩蛋** — 酒鬼人格触发机制
- **移动端优先** — 响应式布局
- **易于定制** — 数据在 `data/*.json`，改 JSON 即可

## 项目结构

```
├── data/                    # 测试数据（修改这里来定制）
│   ├── questions.json       # 题目和选项
│   ├── dimensions.json      # 15个维度定义
│   ├── types.json           # 人格类型和匹配模式
│   └── config.json          # 评分参数和显示配置
├── src/                     # 源代码
│   ├── engine.js            # 评分算法（纯函数）
│   ├── quiz.js              # 答题流程控制
│   ├── result.js            # 结果页渲染
│   ├── chart.js             # 雷达图（Canvas API）
│   ├── utils.js             # 工具函数
│   ├── main.js              # 入口
│   └── style.css            # 样式（CSS变量主题化）
├── docs/
│   └── analysis.md          # 数据分析报告
└── index.html
```

## 快速开始

**请使用 Vite 开发服务器**（不要直接双击打开 `index.html`，否则模块与路径容易404）。

```bash
git clone https://github.com/ktwu01/ChuangBTI.git
cd ChuangBTI

npm install
npm run dev
```

浏览器打开终端里提示的本地地址（本项目默认可用 `http://localhost:5180/`；可用 `VITE_DEV_PORT=端口 npm run dev` 覆盖）。

```bash
# 构建生产版本（输出 dist/，部署时只上传 dist 内文件）
npm run build

# 若站点必须挂在固定子路径（如仅支持 /ChuangBTI/ 绝对前缀）
npm run build:subdir
```

## 定制你自己的测试

所有测试内容都在 `data/` 目录下，修改 JSON 文件即可定制，无需改动代码。

### 修改题目

编辑 `data/questions.json`，每道题的结构：

```json
{
  "id": "q1",
  "dim": "S1",
  "text": "你的题目文字",
  "options": [
    { "label": "选项A", "value": 1 },
    { "label": "选项B", "value": 2 },
    { "label": "选项C", "value": 3 }
  ]
}
```

- `dim` 指定该题属于哪个维度
- `value` 分值：1=低, 2=中, 3=高
- 每个维度需要恰好 2 道题

### 添加新人格类型

编辑 `data/types.json`，在 `standard` 数组中添加：

```json
{
  "code": "YOUR",
  "pattern": "HHH-HMH-MHH-HHH-MHM",
  "cn": "你的类型名",
  "intro": "一句话简介",
  "desc": "详细描述..."
}
```

`pattern` 是 15 个字母的 L/M/H 组合（按维度顺序：S1-S3, E1-E3, A1-A3, Ac1-Ac3, So1-So3），用 `-` 分隔每个模型。

### 调整评分参数

编辑 `data/config.json`：

```json
{
  "scoring": {
    "levelThresholds": { "L": [2, 3], "M": [4, 4], "H": [5, 6] },
    "maxDistance": 30,
    "fallbackThreshold": 60
  }
}
```

- `maxDistance`：相似度公式分母（默认 15 维 × 每维最大差 2 = 30）
- `fallbackThreshold`：最佳匹配相似度低于该百分数时落入 HHHH 傻乐者兜底

### 部署路径（GitHub Pages）

- 默认 `npm run build` 使用 **`base: './'`**，`dist/` 内为相对路径，适合挂在 `https://<user>.github.io/<repo>/`。
- 若必须用绝对前缀 `/ChuangBTI/`，使用 `npm run build:subdir` 或设置环境变量：`VITE_BASE=/你的仓库名/ npm run build`。

### 修改主题样式

编辑 `src/style.css` 顶部的 CSS 变量：

```css
:root {
  --bg: #f0f4f1;
  --accent: #4c6752;
  /* ... */
}
```

## 评分算法

1. **求和**：每维度 2 题分值相加（范围 2-6）
2. **分级**：≤3 → L（低），4 → M（中），≥5 → H（高）
3. **向量化**：L=1, M=2, H=3，生成 15 维数值向量
4. **匹配**：计算用户向量与每种类型的曼哈顿距离
5. **排名**：距离升序 → 精准命中降序 → 相似度降序
6. **特殊覆盖**：酒鬼彩蛋 > 正常匹配 > 傻乐者兜底（相似度低于 `config.scoring.fallbackThreshold`，默认 60）

详见 [数据分析报告](docs/analysis.md)。

## 部署

### GitHub Pages

将 **`npm run build` 生成的 `dist/` 目录内容** 作为站点根目录发布（不要只上传带 `src/` 的源码，否则浏览器找不到打包后的 JS/CSS）。

### Vercel / Netlify

连接本仓库，构建命令 `npm run build`，输出目录 `dist`。

### 手动部署

```bash
npm run build
# 将 dist/ 目录部署到任何静态服务器
```

## 技术栈

- [Vite](https://vitejs.dev/) — 构建工具
- 原生 JavaScript — 无框架依赖
- Canvas API — 雷达图与分享图
- CSS Custom Properties — 主题化

## 致谢

- 原创测试：B站UP主 [@蛆肉儿串儿](https://space.bilibili.com/417038183)（UID: 417038183）
- 原版活动：[B站活动页（原 SBTI 企划）](https://www.bilibili.com/blackboard/era/VxiCX2CRqcqzPK9F.html)

## 声明

本测试仅供娱乐，请勿用于任何严肃场景。本项目为开源二创，如有侵权请联系删除。

## License

[MIT](LICENSE)
