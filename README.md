# pora-zh · 机器人自主性原理（中文精译课程）

斯坦福自主系统实验室（Stanford ASL）在线教材 [*Principles of Robot Autonomy* (porabook.com)](https://porabook.com/) 的全本中文精译课程站。

🌐 **在线站点（GitHub Pages）**：[https://hsthanb4.github.io/pora-zh/](https://hsthanb4.github.io/pora-zh/)

---

## 全书 19 章导航

| 编号 | 章节名称 | 英文原名 | 练习数 |
|:---:|---|---|:---:|
| 01 | [**机器人动力学建模**](https://hsthanb4.github.io/pora-zh/ch01.html) | Modeling Robot Dynamics | 4 |
| 02 | [**开环控制与轨迹优化**](https://hsthanb4.github.io/pora-zh/ch02.html) | Open-Loop Control & Trajectory Optimization | 5 |
| 03 | [**闭环控制与轨迹跟踪**](https://hsthanb4.github.io/pora-zh/ch03.html) | Closed-Loop Control & Trajectory Tracking | 7 |
| 04 | [**运动规划**](https://hsthanb4.github.io/pora-zh/ch04.html) | Motion Planning | 3 |
| 05 | [**机器人传感器导论**](https://hsthanb4.github.io/pora-zh/ch05.html) | Introduction to Robot Sensors | 0 |
| 06 | [**相机模型与标定**](https://hsthanb4.github.io/pora-zh/ch06.html) | Camera Models and Calibration | 3 |
| 07 | [**立体视觉与运动恢复结构**](https://hsthanb4.github.io/pora-zh/ch07.html) | Stereo Vision and Structure From Motion | 0 |
| 08 | [**经典感知方法**](https://hsthanb4.github.io/pora-zh/ch08.html) | Classical Methods for Perception | 2 |
| 09 | [**感知的深度学习架构**](https://hsthanb4.github.io/pora-zh/ch09.html) | Deep Learning Architectures for Perception | 1 |
| 10 | [**目标检测与识别**](https://hsthanb4.github.io/pora-zh/ch10.html) | Object Detection and Recognition | 1 |
| 11 | [**定位与滤波导论**](https://hsthanb4.github.io/pora-zh/ch11.html) | Introduction to Localization and Filtering | 1 |
| 12 | [**状态估计的近似滤波**](https://hsthanb4.github.io/pora-zh/ch12.html) | Approximate Filters for State Estimation | 2 |
| 13 | [**机器人定位**](https://hsthanb4.github.io/pora-zh/ch13.html) | Robot Localization | 2 |
| 14 | [**同步定位与建图（SLAM）**](https://hsthanb4.github.io/pora-zh/ch14.html) | Simultaneous Localization and Mapping | 3 |
| 15 | [**传感器融合与目标跟踪**](https://hsthanb4.github.io/pora-zh/ch15.html) | Sensor Fusion and Object Tracking | 1 |
| 16 | [**有限状态机**](https://hsthanb4.github.io/pora-zh/ch16.html) | Finite State Machines | 0 |
| 17 | [**序列决策与动态规划**](https://hsthanb4.github.io/pora-zh/ch17.html) | Sequential Decision Making and Dynamic Programming | 1 |
| 18 | [**强化学习**](https://hsthanb4.github.io/pora-zh/ch18.html) | Reinforcement Learning | 4 |
| 19 | [**模仿学习**](https://hsthanb4.github.io/pora-zh/ch19.html) | Imitation Learning | 0 |

---

## 页面与排版特性

- **公式离线预渲染**：基于 MathJax 3 将全部 5,671 处数学公式预编译为紧凑矢量 SVG（全局 FontCache），浏览器打开秒开、无公式抖动，离线可看。
- **公式编号 100% 对齐**：全书 322 处编号公式严格与英文原版保持 1:1 一致（如 `(1.1)`～`(1.35)`、`(18.1)`～`(18.37)`），交叉引用清晰可查。
- **知识卡片体系**：定义（`def`）、定理（`thm`）、示例（`ex`）、算法（`algo`）采用层级语义卡片设计，配色分明。
- **现代化阅读体验**：左侧粘性侧边栏目录带 IntersectionObserver 滚动高亮、上下章翻页导航、移动端响应式适配、打印样式。
- **轻量资源**：插图转优化 WebP / 原生矢量 SVG，整站静态 HTML 仅 11.9 MB。

---

## 本地重新构建

```bash
# 安装依赖（MathJax 全量解析引擎）
npm install

# 全量公式离线自检（校验所有 Markdown 源文件的公式语法）
node check.mjs

# 构建全站静态 HTML（产物位于 docs/）
node build.mjs
```

---

## 目录结构

```
pora-zh/
├── content/           # 19 章中文 Markdown 精译源文件 (ch01.md ~ ch19.md)
├── assets/            # 插图资产（分章存放为 WebP 与 SVG）
├── src/
│   ├── chapters.json  # 19 章节元数据
│   └── extract.py     # 英文原版抽取与公式规整脚本
├── docs/              # GitHub Pages 静态网站根目录 (index.html, ch01~ch19.html)
├── course.css         # 课程站样式
├── course.js          # 目录滚动监听高亮
├── check.mjs          # 逐条公式渲染校验工具
├── build.mjs          # 离线 MathJax SVG 静态编译与网页生成器
└── BUILD.md           # 技术细节与排坑备忘录
```

---

## 声明

本教程仅供个人学术研究与技术学习交流使用。原文内容版权归 *Principles of Robot Autonomy* 作者（Stanford Autonomous Systems Laboratory）所有。
