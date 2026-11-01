# CHANGELOG

本轮记录 Flow Matching 交互式教程的第二轮精准修复。论文依据：**Flow Matching for Generative Modeling**，Yaron Lipman et al., arXiv:2210.02747v2。

## P0 — 知识与计算正确性

### P0-1：§3.1 条件场箭头尺度与加权分量

- 保留二维混合高斯的后验权重与边缘场公式：
  - `w_i(t,x)=π_i p_t(x|x_i)/Σ_j π_j p_t(x|x_j)`
  - `u_t(x)=Σ_i w_i(t,x)u_t(x|x_i)`
- 权重改用 **log-density + log-sum-exp** 计算，避免极端 `t,x` 下密度下溢。
- 所有箭头共用同一个像素/单位比例 `scale = 160 / maxLen`：
  - 同时计算三个条件向量和边缘向量的最大模长；
  - 不对每根箭头分别归一化；
  - 默认红色边缘箭头约 37 px，t≈0.95 时约 69 px，均清晰可见。
- 红色边缘箭头增加白色描边、加粗线条和端点圆点，避免与条件箭头重叠而不可见。
- 新增“显示加权分量 / 显示条件场”切换：
  - 加权模式绘制 `w_i u_t(x|x_i)`；
  - 条件模式绘制原始 `u_t(x|x_i)`；
  - 两种模式都使用同一比例尺。
- 增加颜色图例、当前比例尺、最大模长和加权/条件模式说明。

### P0-2：§3.2 真实伯努利小批量估计

- 删除 `0.12*sin(7θ+1.3)` 的人为确定性扰动。
- 使用真实条件回归模型：
  - `Y=0.5+ε`
  - `P(ε=±√1.6)=0.5`
  - `L_FM(θ)=0.5(θ−0.5)²`
  - `L_CFM(θ)=0.5E[(θ−Y)²]=L_FM(θ)+0.8`
- 开启小批量后，从 `Y` 分布真实随机抽取样本，计算经验 CFM 曲线、样本均值与经验梯度。
- 支持 batch `8 / 32 / 128`、重新采样、显示差值、关闭小批量。
- 理论 CFM 曲线与经验 CFM 曲线分开绘制；经验曲线不再强行满足固定差值。
- 显示标准误 `√(1.6/n)`，并说明单次实验不保证 batch 增大时误差严格减小。
- “重置”恢复：`θ=0.20`、关闭小批量、batch=32、显示差值、重新生成样本池、恢复反馈。
- 明确标注：教学统计模型，不是论文真实训练曲线。

### P0-3：§8 CFM 训练伪代码

- 增加 `optimizer.zero_grad(set_to_none=True)`。
- 明确图像张量形状与时间广播：
  - `x1, x0: [B,C,H,W]`
  - `t_flat: [B]`
  - `t_view: [B,1,1,1]`
  - 插值与目标使用 `t_view`；
  - 模型接收 `t_flat`，并注明若模型需要广播则传 `t_view`。
- 训练顺序调整为：采样 → 广播 → 插值 → 目标 → 清梯度 → 前向/损失 → 反向 → 更新。
- 保留“简化训练示意，非论文官方源码”的说明。

## P1 — 理论严谨性

### P1-1：§5 OT 端点边界

- 从 `σ_min=0` 改为论文要求的正终端标准差 `σ_min=0.05`。
- OT 条件路径保持直线，但 `t=1` 端点为 `x1 + σ_min x0`，落在 `x1` 附近的窄高斯内，不是点质量。
- 图中目标环画在均值 `x1`，空心圈标出实际端点；读数区显示：
  - `OT 端点偏移 |ψ₁−x₁|`；
  - `扩散起点偏移`；
  - OT/扩散相对自身直线的最大偏离。
- 按钮反馈和图注改为“同一潜在样本 x0/x1”，明确 VP 有限时间起点与 OT 端点并不完全相同。
- 保留“条件 OT ≠ 边缘/全局 OT”的边界。

### P1-2：§9 指标分组图

- 柱状图改为三项指标各自独立坐标轴的分组比较：
  - NLL/BPD：0–4；
  - FID：0–7；
  - NFE：0–220。
- 每组分别比较 Score Matching、FM-Diffusion、FM-OT，并显示原始数值标签和方法缩写。
- 顶部增加“全部指标 / NLL/BPD / FID / NFE”切换，突出对应分组。
- 明确说明柱长不能跨指标比较；三项指标归一化基准不同。
- 数值严格使用 Table 1 的 ImageNet 32×32 数据；保留“SM FID 5.68 < FM-Diffusion 6.37”的边界。

## P2 — 展示与可用性

- §2、§4 高斯密度图增加“自适应刻度 / 固定刻度”切换与当前纵轴范围读数；曲线仍使用真实归一化密度，不改变密度值。
- §6 增加 Euler/Midpoint/RK4 图例，明确左图轨迹、右图 `log10(NFE)`–`log10(误差)` 坐标轴，当前求解器/NFE 点高亮。
- 论文 Figure 支持点击放大；增加全屏 lightbox 与关闭按钮。
- `index.html` 改为标准响应式视口 `width=device-width, initial-scale=1`；保留侧边导航与章节切换。
- 为固定底部导航增加内容底部留白；Canvas 使用 `max-width:100%; height:auto`，移动端保持比例。
- 精简重复的 “simulation-free training ≠ ODE-free sampling” 表述，保留 §6/§8 的关键强调。

## 文件变更

- `src/modules/ch3-flight.tsx`
- `src/modules/ch2-flight.tsx`
- `src/modules/ch4-flight.tsx`
- `src/modules/ch5-flight.tsx`
- `src/modules/ch6-flight.tsx`
- `src/modules/ch9-flight.tsx`
- `src/modules/ch10-flight.tsx`
- `src/data/tutorial.ts`
- `src/styles/paper.css`
- `src/components/Figure.tsx`
- `src/components/BiliVideos.tsx`
- `src/App.tsx`
- `index.html`

## 仍未实施/限制

- Appendix Figure 9/10 未重复嵌入；§9 使用 Figure 4/5，并在页面说明 9/10 的位置。
- B 站链接、标题与内容未逐条核验；页面已显示“延伸资料，未逐条核验”。
- 未训练真实大规模生成模型或下载 ImageNet；所有实验数值来自论文 Table 1/2。
- 单文件 HTML 的 B 站封面/播放量需要联网；教程主体、Canvas 与论文插图可离线。
- 当前 OpenCode 环境禁止本地端口监听（`EACCES`），浏览器验收使用单文件 `file://` 模式；普通环境仍可运行 `npm run dev`。
