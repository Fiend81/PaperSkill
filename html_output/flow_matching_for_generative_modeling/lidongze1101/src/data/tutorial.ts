import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Flow Matching for Generative Modeling",
    "titleZh": "面向生成建模的流匹配",
    "venue": "arXiv 2210.02747v2 · 2023",
    "authors": "Yaron Lipman, Ricky T. Q. Chen, Heli Ben-Hamu, Maximilian Nickel, Matt Le",
    "affiliation": "Meta AI (FAIR) · Weizmann Institute of Science",
    "domain": "生成模型 / 连续归一化流 / 图像生成",
    "coreProblem": "扩散模型同样有结构化的概率路径，但路径族通常受扩散过程构造约束；训练和采样也可能付出较高的仿真/函数评估成本。",
    "coreInsight": "直接指定一条概率路径并回归生成它的向量场；CFM 让训练无需 ODE 仿真，但采样仍需数值积分。OT 条件路径更直，但边缘/最终轨迹不保证严格直线。",
    "keywords": [
      "Flow Matching",
      "连续归一化流",
      "最优传输",
      "扩散模型",
      "生成建模"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "扩散/分数匹配：同样有结构化的概率路径，但路径族通常受扩散过程约束，采样常需要较多函数评估。",
      "componentId": "hero-flight"
    },
    "newMethod": {
      "desc": "流匹配 + OT 条件路径：直接回归向量场；条件轨迹更直，但边缘/最终轨迹不保证严格直线，采样仍需 ODE 积分。",
      "componentId": "hero-flight"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "问题：为什么需要一条可学的路线",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "扩散模型并不是随机碰运气：它也有结构化的概率路径。先看传统扩散方法在路径选择上的限制，以及 FM 为什么要直接指定路径。",
      "analogy": {
        "title": "固定航线的纸飞机",
        "text": "纸飞机需要一条可选择的航线；扩散模型并非没有路线，而是路线通常由扩散过程构造决定。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "受限航线实验",
          "desc": "拖动发射方向，体验“路线由外部条件决定、不能直接按目标设计”的限制；这不是在说扩散模型没有路线。",
          "componentId": "ch1-flight"
        }
      ],
      "insight": "关键不是“有没有路线”，而是能否直接指定并学习一条适合目标的概率路径。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "路线受约束",
          "desc": "扩散模型有结构化路径，但路径族受扩散过程限制。"
        },
        {
          "icon": "🔧",
          "title": "不是盲目飞行",
          "desc": "传统方法并非随机碰撞；限制在于路径构造与采样成本。"
        },
        {
          "icon": "✨",
          "title": "FM 的改变",
          "desc": "直接指定概率路径，再回归生成它的向量场。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把样本放上时间轴：高斯条件路径",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "CNF（连续归一化流）用向量场生成概率路径：dφ_t/dt=v_t(φ_t)，p_t=[φ_t]_*p_0。Flow Matching 进一步用一条高斯条件路径描述从噪声到数据的过渡。",
      "analogy": {
        "title": "在飞行日志上画时间线",
        "text": "条件路径把“噪声到数据”拆成每个时刻都能采样、能计算的高斯分布。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "时间刻度尺",
          "desc": "拖动时间 t 或选择固定噪声样本 x₀，观察真实归一化高斯密度、均值、标准差与流位置如何同步变化。",
          "componentId": "ch2-flight"
        }
      ],
      "insight": "条件路径 = 每个时刻一个高斯分布；分布均值 μ_t 与固定样本的流位置 ψ_t(x₀) 是两个不同对象。",
      "formula": {
        "lead": "每个时刻的样本都服从一个以 μ_t 为中心、以 σ_t 为标准差的归一化高斯分布（论文 Eq. 10）；峰值高度 1/(√(2π)σ_t) 会随 σ_t 变化。",
        "unicode": "p_t(x | x₁) = N(x | μ_t(x₁), σ_t(x₁)² I)",
        "symbols": [
          {
            "sym": "x",
            "desc": "中间时刻的样本，d 维向量。"
          },
          {
            "sym": "x₁",
            "desc": "一个真实数据样本，d 维向量。"
          },
          {
            "sym": "μ_t",
            "desc": "条件均值，d 维向量；μ_0=0，μ_1=x₁。"
          },
          {
            "sym": "σ_t",
            "desc": "条件标准差，正标量；σ_0=1，σ_1=σ_min。"
          },
          {
            "sym": "I",
            "desc": "d 维单位矩阵。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "时间索引",
          "desc": "t=0 是噪声，t=1 是数据附近。"
        },
        {
          "icon": "🔧",
          "title": "高斯族",
          "desc": "均值和标准差决定每个时刻的分布。"
        },
        {
          "icon": "✨",
          "title": "峰值会变",
          "desc": "σ_t 越小，归一化密度峰值越高；均值移动与单个样本流位置不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键洞察：条件航线可以拼出边缘航线",
      "badge": "both",
      "badgeLabel": "直觉 + 训练",
      "bridge": "边缘向量场是难解积分；Theorem 1 说明同一 (t,x) 处的条件向量场按后验权重聚合可得到它。注意：不是把不同粒子的轨迹坐标做算术平均。",
      "analogy": {
        "title": "三条航线，一个加权箭头",
        "text": "每条条件航线容易计算；边缘向量场要在同一时刻、同一位置按后验权重聚合条件向量场，而不是平均轨迹坐标。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "条件航线的加权聚合",
          "desc": "在二维混合高斯中拖动空间位置 x、调节 t；箭头由公式实时计算，三条条件轨迹仅作几何参考，边缘向量场是同一 (t,x) 处的加权和。",
          "componentId": "ch3-flight"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "FM 与 CFM 的梯度",
          "desc": "拖动 θ 比较理论 FM/CFM 损失曲线与从 Y=0.5±√1.6 真实抽样得到的经验 CFM 曲线；理论期望下两条理论曲线只差常数，因此对 θ 的梯度相同。这不是论文实验曲线，也不是任意样本级梯度逐点相同。",
          "componentId": "ch3-flight"
        }
      ],
      "insight": "Theorem 1 解决边缘场如何由条件场聚合；Theorem 2 解决 CFM 目标为何可替代 FM；Theorem 3 解决条件场如何闭式计算。",
      "formula": {
        "lead": "FM 对齐边缘场（Eq. 5）；CFM 对齐条件场（Eq. 9）。Theorem 2 说的是期望参数梯度相同，不是每个样本的梯度逐点相同。",
        "unicode": "L_FM(θ) = E_{t,p_t(x)} ‖v_t(x) − u_t(x)‖²<br/>L_CFM(θ) = E_{t,q(x₁),p_t(x|x₁)} ‖v_t(x) − u_t(x|x₁)‖²",
        "symbols": [
          {
            "sym": "L_FM",
            "desc": "流匹配目标；需要边缘目标向量场 u_t(x)。"
          },
          {
            "sym": "L_CFM",
            "desc": "条件流匹配目标；只需要可计算的条件目标向量场。"
          },
          {
            "sym": "v_t",
            "desc": "可学习的向量场，输出 d 维速度。"
          },
          {
            "sym": "u_t(x)",
            "desc": "生成边缘路径的目标向量场，通常不可直接计算。"
          },
          {
            "sym": "u_t(x|x₁)",
            "desc": "生成单条条件路径的目标向量场，可闭式计算。"
          },
          {
            "sym": "θ",
            "desc": "向量场网络的参数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "条件可算",
          "desc": "单条条件向量场只依赖一个样本。"
        },
        {
          "icon": "🔧",
          "title": "同一 (t,x) 加权",
          "desc": "聚合对象是同一空间位置的条件向量场，不是轨迹坐标。"
        },
        {
          "icon": "✨",
          "title": "期望梯度",
          "desc": "CFM 与 FM 的期望参数梯度相同；有限样本估计仍可能波动。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "核心公式：仿射高斯流的条件向量场",
      "badge": "both",
      "badgeLabel": "直觉 + 训练",
      "bridge": "条件路径是高斯分布时，对选定的仿射流映射可以闭式求出一个条件向量场；但这不是生成该概率路径的唯一向量场。",
      "analogy": {
        "title": "调整机翼，让航线更集中",
        "text": "高斯路径的宽度由 σ_t 控制；宽度变了，条件向量场也会跟着变。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "航线宽度与中心",
          "desc": "调节 σ_min 与 t；箭头按 OT 公式实时计算，高亮箭头满足 u_t(ψ_t(x₀)|x₁)=dψ_t/dt。",
          "componentId": "ch4-flight"
        }
      ],
      "insight": "只要 μ_t、σ_t 可微且 σ_t>0，选定的仿射流就唯一确定一个条件向量场；但生成同一条高斯路径的向量场并不唯一。",
      "formula": {
        "lead": "对选定的仿射高斯流求时间导数（Theorem 3, Eq. 15），就得到每个时刻要回归的条件速度。",
        "unicode": "u_t(x | x₁) = (σ′_t(x₁) / σ_t(x₁)) (x − μ_t(x₁)) + μ′_t(x₁)",
        "symbols": [
          {
            "sym": "u_t(x | x₁)",
            "desc": "由所选仿射高斯流映射唯一确定的条件向量场；并非生成该高斯概率路径的唯一向量场。"
          },
          {
            "sym": "σ′_t",
            "desc": "标准差对时间的导数。"
          },
          {
            "sym": "μ′_t",
            "desc": "均值对时间的导数。"
          },
          {
            "sym": "σ_t",
            "desc": "条件标准差，必须为正。"
          },
          {
            "sym": "μ_t",
            "desc": "条件均值，控制分布中心。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "闭式目标",
          "desc": "高斯路径的条件向量场可以直接算。"
        },
        {
          "icon": "🔧",
          "title": "两个旋钮",
          "desc": "均值控制中心，标准差控制宽度。"
        },
        {
          "icon": "✨",
          "title": "唯一性边界",
          "desc": "闭式场由所选仿射流唯一确定；同一路径仍可由其他向量场生成。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "选择路径：扩散曲线还是 OT 直线",
      "badge": "both",
      "badgeLabel": "直觉 + 训练",
      "bridge": "扩散路径是经典选择；OT 条件路径让固定样本的条件轨迹变直。注意：条件 OT 不等于全局/边缘 OT。",
      "analogy": {
        "title": "绕弯滑翔，还是直线投掷",
        "text": "扩散条件流可能绕行；OT 条件轨迹更直，但不代表所有边缘/学习到的轨迹都严格直线。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "同步比较两种航线",
          "desc": "图中上方为论文 Figure 2（diffusion conditional score function 与 OT conditional vector field，不是同类对象），下方为 Figure 3（Diffusion/OT trajectories）；再下方用同一固定 x₀、x₁ 真实计算 VP 扩散条件流与 OT 条件流，比较轨迹几何。",
          "componentId": "ch5-flight",
          "figure": "./images/figure-2-3-paths.png"
        }
      ],
      "insight": "OT 条件轨迹在固定 x₀、x₁ 下是直线且速度恒定；条件 OT 不等于边缘 OT，神经网络学到的最终采样轨迹也不保证严格直线。",
      "formula": {
        "lead": "OT 条件路径把均值设为 t x₁，把标准差设为从 1 线性降到 σ_min（论文 Eq. 20–22）。",
        "unicode": "ψ_t(x) = (1 − (1 − σ_min)t)x + t x₁<br/>u_t(x | x₁) = (x₁ − (1 − σ_min)x) / (1 − (1 − σ_min)t)",
        "symbols": [
          {
            "sym": "ψ_t",
            "desc": "OT 条件流映射。"
          },
          {
            "sym": "σ_min",
            "desc": "终端标准差，越小终点越集中。"
          },
          {
            "sym": "u_t(x | x₁)",
            "desc": "OT 条件向量场，方向不随时间改变。"
          },
          {
            "sym": "x₁",
            "desc": "数据样本。"
          },
          {
            "sym": "t",
            "desc": "时间变量，从 0 到 1。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "路径可选",
          "desc": "扩散路径只是高斯路径族的一个特例。"
        },
        {
          "icon": "🔧",
          "title": "OT 条件轨迹",
          "desc": "固定 x₀、x₁ 时，线性插值给出直线条件轨迹和恒定速度。"
        },
        {
          "icon": "✨",
          "title": "三层边界",
          "desc": "条件 OT ≠ 边缘 OT；边缘/最终采样轨迹也不保证严格直线。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "采样：沿着向量场积分",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "训练可以 simulation-free，但生成样本仍要把 ODE 从 t=0 积分到 t=1；两者不要混淆。",
      "analogy": {
        "title": "放飞并跟踪纸飞机",
        "text": "采样就是沿着学到的向量场，一步一步把噪声推到数据。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步飞行",
          "desc": "上方 Figure 6 是论文真实采样路径；下方用教学玩具向量场真实执行 Euler/Midpoint/RK4，与 4096 步 RK4 参考解比较，NFE 按实际函数评估次数统计。",
          "componentId": "ch6-flight",
          "figure": "./images/figure-6-sample-paths.png"
        }
      ],
      "insight": "采样是数值积分；步数、求解器和路径形状共同决定 NFE 与误差。",
      "formula": {
        "lead": "CNF 由向量场生成概率路径（Eq. 1）；连续性方程（Appendix B, Eq. 26）刻画概率密度如何随流演化。",
        "unicode": "dφ_t(x)/dt = v_t(φ_t(x))，φ_0(x) = x<br/>∂p_t(x)/∂t + ∇·(p_t(x)v_t(x)) = 0",
        "symbols": [
          {
            "sym": "φ_t",
            "desc": "从 x 出发的流映射。"
          },
          {
            "sym": "v_t",
            "desc": "训练好的向量场。"
          },
          {
            "sym": "p_t",
            "desc": "时刻 t 的概率密度。"
          },
          {
            "sym": "∇·",
            "desc": "对空间变量取散度。"
          },
          {
            "sym": "t",
            "desc": "从 0 到 1 的积分时间。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "采样即积分",
          "desc": "从 x₀~N(0,I) 出发解 ODE。"
        },
        {
          "icon": "🔧",
          "title": "求解器有取舍",
          "desc": "Euler 便宜，RK4 更准但 NFE 更高。"
        },
        {
          "icon": "✨",
          "title": "路径越直",
          "desc": "低 NFE 下越容易保持精度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练：让向量场对准条件目标",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "有了条件路径和闭式条件场，训练目标是一次回归；但真实网络训练仍是一个优化问题。下面用一维二次损失解释学习率如何影响梯度下降。",
      "analogy": {
        "title": "练习投掷：根据落点修正力度",
        "text": "训练就是不断采样、预测、比较目标，然后按误差修正网络。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "练习投掷",
          "desc": "用一维二次损失真实执行梯度下降；学习率控制慢收敛、稳定收敛、震荡或发散。它是优化器玩具模型，不是 CFM 网络训练曲线。",
          "componentId": "ch7-flight"
        }
      ],
      "insight": "CFM 训练是回归条件向量场；真实训练用梯度下降优化网络。Simulation-free 指训练不需要 ODE 求监督目标，不代表采样不需要 ODE。",
      "formula": {
        "lead": "对 OT 条件路径，训练目标就是把网络输出回归到“数据方向减去噪声方向”的直线速度（Eq. 23）。",
        "unicode": "L_CFM(θ) = E_{t,q(x₁),p₀(x₀)} ‖v_t(ψ_t(x₀)) − (x₁ − (1 − σ_min)x₀)‖²",
        "symbols": [
          {
            "sym": "ψ_t",
            "desc": "时刻 t 的插值样本。"
          },
          {
            "sym": "x₁",
            "desc": "真实数据样本。"
          },
          {
            "sym": "x₀",
            "desc": "标准高斯噪声样本。"
          },
          {
            "sym": "σ_min",
            "desc": "终端标准差。"
          },
          {
            "sym": "v_t",
            "desc": "网络输出的向量场。"
          },
          {
            "sym": "θ",
            "desc": "网络参数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "逐样本回归",
          "desc": "目标由每个 (x₀,x₁,t) 直接算出。"
        },
        {
          "icon": "🔧",
          "title": "训练无仿真",
          "desc": "不需要在训练循环里解 ODE。"
        },
        {
          "icon": "✨",
          "title": "学习率有边界",
          "desc": "二次损失下 η<2 才稳定；太小收敛慢，太大震荡或发散。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "方法结构：一张无需仿真的飞行计划台",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "把训练目标拆开看，它是一条很短的计算链：采样、插值、求目标、回归。Theorem 1→2→3 正好解释了这条链为什么可计算。",
      "analogy": {
        "title": "在飞行计划台上点选一条航线",
        "text": "训练链路很短：采样、插值、求目标、回归，不需要在训练时仿真整段飞行。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "飞行计划台",
          "desc": "点选管线中的节点，查看每一步的张量形状与操作。训练链路只做采样、插值、求目标和回归；<strong>simulation-free training ≠ ODE-free sampling</strong>：生成样本仍要数值积分。<details><summary>查看 OT 条件路径的 CFM 训练伪代码</summary><pre style='margin:8px 0;padding:12px;background:#f5f8f0;border:1px solid #d7deea;border-radius:8px;overflow:auto;font-size:13px;line-height:1.5'>x1 = sample_data(batch_size)              # [B,C,H,W]\nx0 = torch.randn_like(x1)                 # [B,C,H,W]\nt_flat = torch.rand(batch_size, device=x1.device)  # [B]\nt_view = t_flat[:, None, None, None]      # [B,1,1,1]\n\nsigma = 1 - (1 - sigma_min) * t_view\nxt = sigma * x0 + t_view * x1\ntarget = x1 - (1 - sigma_min) * x0\n\noptimizer.zero_grad(set_to_none=True)\npred = model(xt, t_flat)                  # or t_view if the model expects broadcast\nloss = F.mse_loss(pred, target)\nloss.backward()\noptimizer.step()</pre></details><p class='fm-note'>这是 OT 条件路径下的简化训练示意，不是论文官方源码；若换用其他概率路径，条件目标向量场不能直接沿用该 OT 公式。</p><div style='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px'><div style='border:1px solid #d7deea;border-radius:8px;padding:8px'><strong>训练</strong><br/>数据样本 + 噪声 + 随机 t → 条件路径采样 → 条件速度目标 → 网络回归</div><div style='border:1px solid #d7deea;border-radius:8px;padding:8px'><strong>生成</strong><br/>噪声 → 已训练网络输出向量场 → 数值 ODE 积分 → 样本</div></div>",
          "componentId": "ch8-flight",
          "figure": "./images/theorem-map.svg"
        }
      ],
      "insight": "Theorem 1 给出正确的边缘场，Theorem 2 允许用可计算的 CFM 目标，Theorem 3 给出闭式条件场；最终得到训练无需 ODE 仿真的回归目标。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "链路很短",
          "desc": "采样、插值、求目标、回归。"
        },
        {
          "icon": "🔧",
          "title": "目标可算",
          "desc": "u_t 来自闭式条件路径，不来自 ODE。"
        },
        {
          "icon": "✨",
          "title": "训练/生成不同",
          "desc": "训练不做 ODE 仿真；生成仍要 ODE 数值积分。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实用机制：稳定性、路径与似然",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "方法能否落地，还取决于训练稳定性、采样成本和似然评估。论文给出了真实实验曲线与 Table 1 数值，但稳定性和单项指标不能混为一谈。",
      "analogy": {
        "title": "检查风向与配平",
        "text": "训练稳定性和采样成本，取决于路径选择与数值求解的配合；纸飞机只是定性隐喻，不是实验测量。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "稳定性与成本",
          "desc": "上方为论文 Figure 4 与 Figure 5 的真实实验图；下方按 NLL/BPD、FID、NFE 三个独立坐标轴分组比较 Score Matching、FM-Diffusion 与 FM-OT 的 Table 1（ImageNet 32×32）数值。飞机抖动不再作为稳定性证据。",
          "componentId": "ch9-flight",
          "figure": "./images/ch9-evidence.png"
        }
      ],
      "insight": "论文报告 FM 用扩散路径训练更稳定；但 Table 1 中 Score Matching 的 FID 5.68 低于 FM-Diffusion 的 6.37，不能把“训练更稳”写成“每项指标都更好”。",
      "formula": {
        "lead": "CNF 的瞬时变量替换把密度变化写成散度（Appendix C, Eq. 27）；BPD 是每维负对数似然除以 log 2（Eq. 37）。图像评估还需 dequantization 与数据变换修正。",
        "unicode": "d/dt log p_t(φ_t(x)) = −∇·v_t(φ_t(x))<br/>BPD = E_{x₁}[ −log₂ p₁(x₁) / d ] = E_{x₁}[ −log p₁(x₁) / (d log 2) ]",
        "symbols": [
          {
            "sym": "p₁",
            "desc": "模型在数据端给出的密度。"
          },
          {
            "sym": "φ_t",
            "desc": "从 x 出发的流映射。"
          },
          {
            "sym": "∇·",
            "desc": "对空间变量取散度；高维时可用 Hutchinson 估计。"
          },
          {
            "sym": "d",
            "desc": "数据维度；图像中为 H×W×3。"
          },
          {
            "sym": "BPD",
            "desc": "每维比特数，越低越好。"
          },
          {
            "sym": "log₂",
            "desc": "以 2 为底的对数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "稳定性是实验观察",
          "desc": "论文报告 FM 用扩散路径训练更稳，但 FID 不一定每项都更好。"
        },
        {
          "icon": "🔧",
          "title": "成本依赖协议",
          "desc": "Table 1 中 OT 的 NFE 更低，但 NFE 依赖求解器、容差与采样设置。"
        },
        {
          "icon": "✨",
          "title": "似然需完整流程",
          "desc": "CNF ODE + Hutchinson；图像 BPD 还需 dequantization/数据变换修正。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果：更快、更稳、更好，也有边界",
      "badge": "both",
      "badgeLabel": "直觉 + 训练",
      "bridge": "最后把方法放回实验：它赢在哪里，代价是什么，哪些结论不能外推？注意赛跑动画只是论文数值的可视化映射。",
      "analogy": {
        "title": "着陆比赛：谁更接近目标",
        "text": "把论文的 FID 放回同一张表里比较，才能看清方法赢在哪里。",
        "componentId": "analogy-flight"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "着陆比赛",
          "desc": "选择数据集并开始比赛；距离按 Table 1 的 FID 反向映射，不是真实生成速度或采样仿真。下方同时列出 ImageNet 128 与超分 Table 2。",
          "componentId": "ch10-flight"
        }
      ],
      "insight": "在论文的图像实验中，FM-OT 在 Table 1 的 CIFAR-10 与 ImageNet 32/64 上 NLL、FID、NFE 三项均最低；超分 FID/IS 更好但 PSNR/SSIM 更低。结论限于图像域与具体协议。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "主结果",
          "desc": "Table 1 中 FM-OT 在 CIFAR-10 与 ImageNet 32/64 的 NLL、FID、NFE 都最低。"
        },
        {
          "icon": "🔧",
          "title": "超分取舍",
          "desc": "FID/IS 更好，但 PSNR/SSIM 低于 SR3；不是所有指标全面胜出。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "结论来自图像实验与具体协议；条件 OT 也不等于边缘 OT。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1cRwJeREgk",
      "title": "【NeurIPS 2024 Tutorial】Flow Matching for Generative Modeling",
      "reason": "专门讲 Flow Matching 的教程，适合建立整体框架。"
    },
    {
      "bvid": "BV1gc8Ez8EFL",
      "title": "《流匹配与扩散模型 | 6.S184 Flow Matching and Diffusion Models》",
      "reason": "MIT 课程，系统讲解流匹配与扩散模型的关系。"
    },
    {
      "bvid": "BV1sn4y1X7s7",
      "title": "Stable Diffusion 3 核心技术：Rectified Flow 论文解读",
      "reason": "直线流路径的延伸阅读，帮助理解 OT 路径的工程价值。"
    }
  ]
};
