# 翻译规范（交给翻译模型执行）

把一章英文原文翻成中文课程稿，输出必须能被 `build.mjs` 直接渲染。

## 输入输出

- 输入：`src/en/chNN.md` —— 从原书网页抽取的英文 Markdown，公式已是 LaTeX（`$...$` / `$$...$$`）。
- 参考：`content/ch01.md` —— 已完成的第 1 章，**格式与文风的唯一标准**，动手前先读它。
- 输出：`content/chNN.md` —— 同样的轻量标记。

## 硬性规则

1. **完整翻译，不许省略、概括、合并或改写结构。** 原文有几节、几段、几个示例，译文就有几个。原文的过渡句、铺垫句、小结句都要译。
2. **公式一律原样搬运。** 不得改动任何 LaTeX 内容（包括 `\bm`、`\begin{bmatrix}`、`\frac` 等），不得新增或删除公式，不得把公式"翻译成文字"。
3. **公式编号必须保留。** 原文带编号的公式（如 `(3.5)`）写成：

   ```
   $${#eq3.5}
   ...LaTeX...
   $$
   ```

   无编号公式就写 `$$` 开头，不加 `{#...}`。编号缺失或错位都算错。
4. **图片行原样保留路径**，只把图注翻成中文：

   ```
   ![图 3.1：中文图注](/book-assets/xxx/figs__xxx.png)
   ```

   路径一个字符都不要改（构建脚本按文件名找本地图）。
5. **代码块原样保留。** 代码不翻译，注释可保留英文。代码前后的说明文字要译。
6. **卡片标记已由抽取器预置**，形如：

   ```
   ::: def Definition 2.1 (State)
   正文……
   :::
   ```

   你要做的是：**保留 `:::` 标记与 kind 不变**，只把标题翻成中文并保留编号，例如：

   ```
   ::: def 定义 2.1（状态）
   正文……
   :::
   ```

   kind 含义：`def` 定义、`thm` 定理、`ex` 示例、`algo` 算法、`note` 说明。标题格式统一为「中文类型 + 原编号（中文名）」。
7. **旁注**保持 `［旁注：中文内容］` 这种全角方括号标记。
8. **标题层级要降一级。** 抽取稿里 `## ` 是原文的 x.1 节，`### ` 是 x.1.1，`#### ` 更深。译文按下面映射（页面渲染时 `#` → 章内节、`##` → 小节）：

   | 抽取稿 | 译文 |
   |---|---|
   | `## Classical Feedback Control` | `# 经典反馈控制` |
   | `### Structure of PID Control` | `## PID 控制的结构` |
   | `#### Designing the cost matrices.` | `### 代价矩阵的设计` |

   标题不要带编号前缀（不写「3.1」「3.1.1」），编号由页面自动生成。

9. **文风**：简洁的技术中文，先结论后解释，不写"本文将""接下来让我们"这类填充语。专有名词首次出现时保留英文原词并加括号，例如「普法夫约束（Pfaffian constraint）」。

## 术语统一表

| 英文 | 中文 |
|---|---|
| state space model / state / input / output | 状态空间模型 / 状态 / 输入 / 输出 |
| kinematics / dynamics | 运动学 / 动力学 |
| generalized coordinates / velocities | 广义坐标 / 广义速度 |
| holonomic / nonholonomic | 完整 / 非完整 |
| Pfaffian constraint | 普法夫约束 |
| configuration space | 位形空间 |
| degrees of freedom | 自由度 |
| optimal control problem | 最优控制问题 |
| performance criterion / cost | 性能指标 / 代价 |
| Pontryagin's Minimum Principle | 庞特里亚金最小值原理 |
| two-point boundary value problem | 两点边值问题 |
| direct collocation / direct shooting | 直接配点 / 直接打靶 |
| differentially flat | 微分平坦 |
| unicycle / differential drive | 独轮车 / 差速驱动 |
| motion planning / trajectory | 运动规划 / 轨迹 |
| trajectory tracking / feedback control | 轨迹跟踪 / 反馈控制 |
| state estimation | 状态估计 |
| Kalman filter / particle filter | 卡尔曼滤波 / 粒子滤波 |
| SLAM | 同步定位与建图（SLAM） |
| odometry / occupancy grid | 里程计 / 占据栅格 |
| camera model / intrinsic / extrinsic | 相机模型 / 内参 / 外参 |
| pinhole / distortion | 针孔 / 畸变 |
| stereo vision / disparity | 立体视觉 / 视差 |
| homography / epipolar | 单应 / 对极 |
| object detection / bounding box | 目标检测 / 边界框 |
| reinforcement learning / policy / value function | 强化学习 / 策略 / 价值函数 |
| Markov decision process | 马尔可夫决策过程 |
| imitation learning / behavior cloning | 模仿学习 / 行为克隆 |
| finite state machine | 有限状态机 |

其余术语自行判断，但**全章一致**。

## 交付前自检（必做）

```bash
cd <repo>
node check.mjs content/chNN.md
```

必须输出 `公式 N 个，失败 0 处`。若有失败，按提示修正该公式（多半是原文 `%` 续行或未定义宏），修到 0 为止。

再自查三件事：

1. 小节数量与原文一致（`grep -c '^#' src/en/chNN.md` 与 `grep -c '^#' content/chNN.md` 对照）；
2. `$$` 块数量与原文一致；
3. 图片行数量与原文一致，路径未改。

只允许改 `content/chNN.md` 这一个文件，不要动其他章节、脚本或素材。
