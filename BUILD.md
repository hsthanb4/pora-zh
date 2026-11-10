# 构建说明 · porabook 中文课程页

把 porabook（*Principles of Robot Autonomy*）的单章网页转成中文课程页，产物是**单文件自包含 HTML**，离线可开。

## 产物

- `机器人动力学建模-中文课程.html` —— 交付物，2.8 MB，图片 base64 内嵌、公式预渲染为 SVG，无任何外部资源请求。

## 目录

| 路径 | 说明 |
|---|---|
| `content/part1-3.md` | 中文译文源（自定义轻量标记：`#` 标题、`:::def/:ex/:note/:algo` 卡片、`$${#eq1.1}` 带编号公式、`$...$` 行内公式、```` ``` ```` 代码、`![]()` 图） |
| `content/original-page.html` | 抓取的原文网页快照（含 MathML + LaTeX alttext） |
| `content/original-extracted.md` | 由原文快照自动抽取的英文 Markdown（核对用） |
| `assets/*.png` | 原文插图（8 张） |
| `build-extract.py` | 原文 HTML → Markdown 抽取脚本 |
| `build.mjs` | 译文 → HTML 构建脚本（MathJax SVG 预渲染 + 图内嵌 + 目录） |
| `course.css` / `course.js` | 样式与滚动高亮 |
| `check.mjs` | 公式渲染自检（逐条渲染，报告 `merror`） |

## 重新构建

```bash
npm i                      # mathjax-full（首次）
node check.mjs             # 公式自检，应输出 failures: 0
node build.mjs             # 生成 HTML
```

## 已处理的坑

1. **`\bm` 未定义** → build.mjs 里注册 `bm → \boldsymbol{#1}` 等宏。
2. **原文 LaTeX 的行尾 `%` 续行**（如 `0\end{%⏎bmatrix}`）在 MathJax 的 `\end{...}` 参数里不被当注释 → 渲染前统一删掉 `%` + 换行，否则出现 3 处 `Unknown environment '%'`。
3. **公式编号**必须与原文一致（1.1–1.35），`{#eqX}` 标签决定编号，`{#eqxN}` 表示不编号。
4. **图幅**：原文是宽栏排版，竖长的单摆图（1:2）直接 100% 宽会撑满屏 → 用 `max-height:460px` + 逐图 `max-width` 限幅。
5. **行内 `code` 不换行**导致窄屏横向溢出 → `overflow-wrap:anywhere`。
