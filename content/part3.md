# 动力学仿真

在 1.1 节我们引入了**状态空间模型**，用数学方式描述机器人状态随时间的演化；在 1.2 节演示了如何用机器人的**运动学与动力学**推导出表示其物理运动的状态空间模型。本节介绍若干**仿真**机器人状态随时间变化的计算技术。

式 (1.1) 的状态空间模型是一般形式的常微分方程组，多数情况下无法解析求解。数值仿真提供了获得近似解的实用途径，使我们能更好地理解机器人动力学，并测试与验证机器人自主性的算法。通常说**仿真**一个系统，指的是近似求解式 (1.1) 微分方程组的**初值问题（IVP）**：

$$
\dot{\bm{x}}=h(\bm{x}(t),t),\quad\bm{x}(t_{0})=\bm{x}_{0},
$$

其中 $h(\bm{x}(t),t)=f(\bm{x}(t),\bm{u}(t))$，输入 $\bm{u}(t)$ 既可以显式定义为时间的已知函数（例如预先给定的控制序列），也可以在每一步根据当前状态计算。

该初值问题的目标是：从 $\bm{x}(t_{0})$ 出发，找出满足该微分方程的轨迹 $\bm{x}(t)$［旁注：若 $h$ 关于 $x(t)$ 满足 Lipschitz 连续、关于 $t$ 连续，则轨迹 $x(t)$ 存在且唯一。］。由**微积分基本定理**［旁注：它表达了微分与积分的互逆关系：对导数 $\dot{\bm{x}}=h(\bm{x}(t),t)$ 关于时间积分即可还原原函数 $\bm{x}(t)$。］，$t$ 时刻的解可写成

$$
\begin{split}\bm{x}(t)&=\bm{x}(t_{0})+\int_{t_{0}}^{t}h(\bm{x}(\tau),\tau)d%
\tau.\end{split}
$$

一般来说，对任意函数 $h(\bm{x}(t),t)$ 解析地计算这个积分是不可行的。因此通常采用**时间离散化**的数值积分方法：

$${#eq1.30}
\begin{split}\bm{x}(t)&=\bm{x}(t_{0})+\sum_{k=0}^{N-1}\int_{t_{k}}^{t_{k+1}}h(%
\bm{x}(\tau),\tau)d\tau,\end{split}
$$

其中 $t_{0}<t_{1}<\dots<t_{N}=t$ 定义一个时间网格，每个区间的宽度为 $\Delta t_{k}=t_{k+1}-t_{k}$。这种分解把连续的积分问题拆成一系列短区间上的小积分之和。在每个区间 $[t_{k},t_{k+1}]$ 内，就可以用各种数值求积规则来近似积分——例如欧拉法、中点法或更高阶的龙格-库塔格式——它们在计算代价与精度之间做权衡。本节简要介绍几种最常用的方法。

:::ex 示例 1.14（一个简单的初值问题）
为演示不同的数值积分方法，考虑下面这个初值问题（对应算法 1.1）：

$$
\dot{x}(t)=x(t)\sin^{2}(t),\quad x(0)=1.
$$

目标是用各种积分方法在区间 $[0,10]$ 上近似轨迹 $x(t)$。

```python
import numpy as np

# Define the derivative function h(x, t)
def h(x, t):
    return x * np.sin(t) ** 2

# Define initial conditions and final time
x0 = 1.0 # Initial state x(t0)
t0 = 0.0 # Initial time t0
tf = 10.0 # Final time tf

Δt = 0.5 # Discretization step
t = np.arange(t0, tf + Δt, Δt) # Array of timestamps

# Compute analytical solution
x_true = x0*np.exp(((t-t0) - np.sin(t-t0)*np.cos(t+t0))/2)

def integrate(h, x0, t, method):
    x = np.zeros((t.size, x0.size))
    x[0] = x0
    for i in range(t.size - 1):
        Δt = t[i + 1] - t[i]
        x[i + 1] = method(h, x[i], t[i], Δt)
    return x

def method(h, x, t, Δt):
    # Implement here numerical integration method

# Test a specific numerical method
x_method = integrate(h, x0, t, method)
```

**算法 1.1：** 一个用于演示的初值问题定义。该示例代码见仓库 `github.com/StanfordASL/pora-exercises` 中的 notebook `ch01/simulation.ipynb`。下面几节会依次尝试不同的数值积分方法，并把它们实现在自定义的 `method` 函数里。

具体来说，我们将用不同方法去近似下面的解析解：

$$
x(t)=x_{0}\exp\left(\frac{t-t_{0}-\sin(t-t_{0})\cos(t+t_{0})}{2}\right),
$$

在我们的初始条件 $x_{0}=1$、$t_{0}=0$ 下，它简化为

$$
x(t)=\exp\left(\frac{t-\sin(t)\cos(t)}{2}\right).
$$
:::

## 欧拉法

在离散化问题的每个时间区间内近似积分（如式 (1.30) 所示）的最简单技术之一，是欧拉法［旁注：以瑞士数学家 Leonhard Euler 命名，常称为**前向欧拉法**。］。该方法用区间起点处的被积函数值来近似短区间 $[t_{k},t_{k+1}]$ 上的积分。

由于轨迹 $\bm{x}(t)$ 满足

$$
\bm{x}(t_{k+1})=\bm{x}(t_{k})+\int_{t_{k}}^{t_{k+1}}h(\bm{x}(\tau),\tau)d\tau,
$$

欧拉法假定 $h(\bm{x}(\tau),\tau)$ 在该区间内为常数，从而近似为

$$
\bm{x}(t_{k+1})\approx\bm{x}(t_{k})+\Delta t\cdot h(\bm{x}(t_{k}),t_{k}),
$$

其中 $\Delta t=t_{k+1}-t_{k}$ 是时间步长。

该近似对应一阶泰勒展开：

$${#eq1.31}
\begin{split}\bm{x}(t+\Delta t)&\approx\bm{x}(t)+\Delta t\,\dot{\bm{x}}(t),\\
&=\bm{x}(t)+\Delta t\cdot h(\bm{x}(t),t),\\
\end{split}
$$

即把变化率 $\dot{\bm{x}}(t)$ 视为区间内不变。

另一种理解方式是把欧拉法看作时间导数的有限差分近似：

$$
\dot{\bm{x}}(t)\approx\frac{\bm{x}(t+\Delta t)-\bm{x}(t)}{\Delta t}.
$$

欧拉法计算开销很小，但由于只依赖每个区间起点的信息，精度有限。其局部截断误差［旁注：即单个时间步内引入的误差。］为 $\mathcal{O}(\Delta t^{2})$ 阶；除非步长取得很小，否则误差在长轨迹上会显著累积。

作为具体说明，示例 1.14 的简单实现见算法 1.2。

:::algo 算法 1.2：欧拉法的 Python 实现
```python
def euler(h, x, t, Δt):
    return x + Δt * h(x, t)

x_euler = integrate(h, x0, t, euler)
```
:::

## 中点法

中点法是欧拉法的改进：它把导数取在时间区间的**中点**而非起点，从而提升精度。回顾一下，欧拉法用 $t$ 时刻的导数 $\dot{\bm{x}}$ 近似下一状态：

$$
\bm{x}(t+\Delta t)\approx\bm{x}(t)+\Delta t\cdot h(\bm{x}(t),t).
$$

相比之下，中点法用 $t+\frac{\Delta t}{2}$ 处的导数值来近似积分：

$${#eq1.32}
\bm{x}(t+\Delta t)\approx\bm{x}(t)+\Delta t\cdot h\left(\bm{x}\left(t+\frac{%
\Delta t}{2}\right),t+\frac{\Delta t}{2}\right).
$$

这样估计更准确，但它还不是显式的，因为 $\bm{x}(t+\frac{\Delta t}{2})$ 事先并不知道。

为此，用一个步长为 $\frac{\Delta t}{2}$ 的欧拉步来近似中点：

$${#eq1.33}
\begin{split}\bm{x}\left(t+\frac{\Delta t}{2}\right)&\approx\bm{x}(t)+\frac{%
\Delta t}{2}\cdot h(\bm{x}(t),t).\end{split}
$$

把这个估计代回，就得到中点法的显式形式：

$$
\bm{x}(t+\Delta t)\approx\bm{x}(t)+\Delta t\cdot h\left(\bm{x}(t)+\frac{\Delta
t%
}{2}\cdot h(\bm{x}(t),t),\;t+\frac{\Delta t}{2}\right).
$$

中点法把局部截断误差从欧拉法的 $\mathcal{O}(\Delta t^{2})$ 降到 $\mathcal{O}(\Delta t^{3})$，在小步长下精度显著提高。代价是每步要计算两次导数——一次在区间起点，一次在中点。

示例 1.14 的简单实现见算法 1.3。

:::algo 算法 1.3：中点法的 Python 实现
```python
def midpoint(h, x, t, Δt):
    t_mid = t + Δt / 2
    x_mid = x + (Δt / 2) * h(x, t)
    return x + Δt * h(x_mid, t_mid)

x_midpoint = integrate(h, x0, t, midpoint)
```
:::

## 龙格-库塔四阶法

欧拉法与中点法都通过在区间内一个或两个特定点上求导数 $\dot{\bm{x}}$，来近似一个时间步内 $\bm{x}$ 的变化量。龙格-库塔族方法把这一思想推广：用多次导数求值换取更高精度。该族中最常用的方法之一是**四阶龙格-库塔法**［旁注：常缩写为 RK4。］，它在区间 $[t,t+\Delta t]$ 上计算四个导数估计：

$$
\bm{x}(t+\Delta t)\approx\bm{x}(t)+\frac{\Delta t}{6}(k_{1}+2k_{2}+2k_{3}+k_{4%
}),
$$

其中

$$
\begin{split}k_{1}&=h(\bm{x}(t),\>t),\\
k_{2}&=h(\bm{x}(t)+\frac{\Delta t}{2}k_{1},\>t+\frac{\Delta t}{2}),\\
k_{3}&=h(\bm{x}(t)+\frac{\Delta t}{2}k_{2},\>t+\frac{\Delta t}{2}),\\
k_{4}&=h(\bm{x}(t)+\Delta tk_{3},\>t+\Delta t).\end{split}
$$

RK4 把局部截断误差降到 $\mathcal{O}(\Delta t^{5})$，精度明显优于欧拉法与中点法。代价是每步要计算四次 $h(\bm{x},t)$，但对许多实际应用而言，该方法仍然计算高效且稳定。

示例 1.14 的 RK4 实现见算法 1.4。

:::algo 算法 1.4：RK4 的 Python 实现
```python
def rk4(h, x, t, Δt):
    k1 = h(x, t)
    k2 = h(x + (Δt / 2) * k1, t + Δt / 2)
    k3 = h(x + (Δt / 2) * k2, t + Δt / 2)
    k4 = h(x + Δt * k3, t + Δt)
    return x + (Δt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)

x_rk4 = integrate(h, x0, t, rk4)
```
:::

为比较这几种方法的表现，可以把它们的输出与解析解画在一起：

![图 1.7：各种数值积分方法的近似结果与解析解的比较，取 $\Delta t=0.5$。](assets/figs__ch01_figs__integration_comparison.png)

需要强调的是，先进的仿真技术远不止这些数值积分方法，它们能够对机器人系统做高保真仿真，包括像素空间中的可视化。这些技术可以融合细致的物理建模、传感器数据融合以及基于学习的方法，从而构造真实而准确的仿真［旁注：一个典型例子是用神经辐射场（NeRF）生成照片级真实的场景。］。正如后续关于感知的章节会讨论的，这些进展对机器人训练、不确定性下的规划，以及在新颖且未见场景中评估自主性栈都至关重要。

# 本章小结

本章介绍了机器人系统建模与仿真背后的基本原理。我们先引入状态空间模型，它提供了描述机器人状态随时间演化的数学框架；接着讨论机器人的运动学与动力学，它们刻画机器人的运动以及作用其上的约束，其中包括广义坐标、运动学约束（完整与非完整），以及用普法夫约束构造运动学模型的方法。全章贯穿了若干实例，如滚动轮、单摆，以及独轮车、差速驱动这类轮式机器人。最后介绍了用于仿真机器人动力学随时间演化的数值积分技术，给出了欧拉法、中点法与龙格-库塔法，并用具体代码示例说明它们的取舍与应用场景。

:::note 延伸阅读
如果希望更深入、更严格地学习本章内容，Siciliano 与 Khatib（2007）、Siciliano 等（2008）［旁注：Siciliano, B., Khatib, O. *Springer Handbook of Robotics*. Springer-Verlag, 2007. Siciliano, B., Sciavicco, L., Villani, L., Oriolo, G. *Robotics: Modelling, Planning and Control*. Springer, 2008.］提供了全面且被广泛采用的参考书。这些教材更深入地覆盖了机器人运动学、动力学与控制的数学基础，并给出更多例子、推导与习题，与本章内容互为补充与延伸。
:::

# 练习

练习的初始代码在 GitHub 上公开。在终端中执行以下命令即可下载：

```bash
git clone https://github.com/StanfordASL/pora-exercises.git
```

## 练习 1：数值积分方法

我们在示例 1.14 中引入了一个简单的初值问题，并在图 1.7 中比较了欧拉法、中点法与四阶龙格-库塔法求解它的差异。本练习将使用 SciPy 提供的更高级数值积分方案 `odeint`。打开 notebook `ch01/exercises/simulation.ipynb`，为阻尼单摆与自行车实现动力学模型，然后用 `odeint` 对它们做仿真。

## 练习 2：非完整轮式机器人动力学

本练习的目标是熟悉书中后续会一直用到的 Python 基础（例如 NumPy 与继承），以及控制非完整轮式机器人的技术。

考虑一个两轮简单机器人，其状态由轴中心位置与航向角定义，如图 1.8 所示。它的运动可用最简单的非完整轮式机器人模型——独轮车模型——描述。

![图 1.8：具有独轮车运动学的机器人的广义坐标。](assets/figs__ch01_figs__nonholo_wheeled_robot.png)

我们将使用的**运动学**模型体现无侧滑滚动约束，如下式所示：

$${#eq1.34}
\begin{split}\dot{x}(t)&=v(t)\cos(\theta(t)),\\
\dot{y}(t)&=v(t)\sin(\theta(t)),\\
\dot{\theta}(t)&=\omega(t).\end{split}
$$

在该模型中，机器人状态为 $\bm{x}=[x,y,\theta]^{\top}$，其中 $[x,y]^{\top}$ 是机器人中心的笛卡尔位置，$\theta$ 是相对 $x$ 轴的航向；控制输入为 $\bm{u}=[v,\omega]^{\top}$，其中 $v$ 是沿机器人主轴方向的速度，$\omega$ 是角速度，受如下控制约束：

$$
|v(t)|\leq 0.75\,\,\mathrm{m/s},\qquad\text{and}\qquad|\omega(t)|\leq 1.0\,\,%
\mathrm{rad/s}.
$$

本练习将演示 Python 类继承的用法，以及用 NumPy 做向量化运算。相关 notebook 为 `ch01/exercises/nonholonomic_wheeled_robot_dynamics.ipynb`。

我们将使用一个 `Dynamics` 基类来承载两种不同的动力学模型：本练习的轮式机器人动力学模型，以及下一练习的双积分器模型。基类包含两个未实现的函数：`step` 与 `rollout`。`step` 把动力学推进一个时间步（含扰动），`rollout` 则多次调用 `step`，得到多步的状态轨迹。由于前馈动力学受扰动影响，同一控制序列会产生不同的轨迹。我们可以用同一初始状态、同一控制序列执行多次 rollout 来观察这一点。

在 notebook 中补全 `RobotDynamics` 类：用离散时间欧拉积分与式 (1.34) 的运动学方程实现 `step` 函数；然后在同一个类中用两层 for 循环实现 `rollout` 函数，内部调用 `step`。最后运行那些对机器人动力学做 rollout 并绘制控制与状态轨迹的单元（这部分代码已经写好）。

## 练习 3：双积分器动力学

本练习考虑双积分器动力学模型：

$${#eq1.35}
\begin{split}\dot{x}(t)&=v_{x}(t),\\
\dot{y}(t)&=v_{y}(t),\\
\dot{v}_{x}(t)&=a_{x}(t),\\
\dot{v}_{y}(t)&=a_{y}(t).\end{split}
$$

在该模型中，机器人状态为 $\bm{x}=[x,y,v_{x},v_{y}]^{\top}$，控制输入为 $\bm{u}=[a_{x},a_{y}]^{\top}$。

注意在上一个练习中，我们用 for 循环对机器人动力学做了多次轨迹 rollout。本练习中，我们将把同一个动力学基类用于 `DoubleIntegratorDynamics` 类，并用批量（batching）来减少多次 rollout 所需的循环层数。相关 notebook 为 `ch01/exercises/double_integrator_dynamics.ipynb`。

- 为减少多次 rollout 所需的 for 循环，把 `step` 中作用的动力学方程做批量处理。实现 `DoubleIntegratorDynamics` 类中的 `step` 函数。
- 用刚写好的 `step` 函数补全 `DoubleIntegratorDynamics` 类中的 `rollout` 函数。注意：这里应当只需要一层 for 循环。
