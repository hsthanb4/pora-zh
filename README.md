# pora-zh · 机器人自主性原理（中文精译课程）

把 [porabook.com](https://porabook.com/book/modeling-robot-dynamics/)（*Principles of Robot Autonomy*，Stanford ASL）的章节翻成中文课程页，产物是**单文件自包含 HTML**，离线可开。

> 本仓库私有，仅个人学习与内部阅读用。原文版权归原作者，请勿公开分发。

## 已完成

| 章节 | 文件 | 规模 |
|---|---|---|
| 第 1 章 Modeling Robot Dynamics | `机器人动力学建模-中文课程.html` | 6 节 / 16 小节，87 个公式（35 个带编号 1.1–1.35），8 幅图，4 段 Python |

页面形态：左侧目录 + 滚动高亮，定义 / 示例 / 算法按类型配色成卡片，公式预渲染为 SVG，图片 base64 内嵌，窄屏自适应，带打印样式。

## 打开方式

双击 `机器人动力学建模-中文课程.html` 即可，无需联网、无需本地服务器。

## 重新构建

```bash
npm i                 # 首次：安装 mathjax-full
node check.mjs        # 公式自检，应输出 failures: 0
node build.mjs        # 生成 HTML
```

## 目录

| 路径 | 说明 |
|---|---|
| `content/part1-3.md` | 中文译文源。轻量标记：`#` 标题、`:::def/:ex/:note/:algo` 卡片、`$${#eq1.1}` 带编号公式、`$...$` 行内公式、```` ``` ```` 代码、`![]()` 图 |
| `content/original-page.html` | 原文网页快照（MathML + LaTeX alttext），重抽取用 |
| `content/original-extracted.md` | 由快照自动抽取的英文 Markdown，核对用 |
| `assets/*.png` | 原文插图 |
| `build-extract.py` | 原文 HTML → Markdown |
| `build.mjs` | 译文 → HTML（MathJax SVG 预渲染 + 图内嵌 + 目录生成） |
| `course.css` / `course.js` | 样式与目录高亮 |
| `check.mjs` | 逐条公式渲染自检，报 `merror` |
| `BUILD.md` | 构建细节与踩坑记录 |

## 新增一章的做法

1. 抓原文页 → `content/original-page.html`，跑 `python3 build-extract.py` 得到英文 Markdown；
2. 按原文结构写 `content/partN.md`，公式编号沿用原文；
3. 把新 part 加进 `build.mjs` 顶部的 `['part1','part2','part3']` 列表；
4. `node check.mjs && node build.mjs`。

## 许可

译文与排版代码仅限个人学习使用；原文文字、公式与插图版权归 *Principles of Robot Autonomy* 作者及出版方所有。
