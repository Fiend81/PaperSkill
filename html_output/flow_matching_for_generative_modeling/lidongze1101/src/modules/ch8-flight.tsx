import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawArrow,
  drawField,
  drawLabel,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;

type NodeId = 'x1' | 'x0' | 't' | 'xt' | 'ut' | 'v' | 'loss';

const NODES: Record<NodeId, { x: number; y: number; label: string; detail: string; color: string }> = {
  x1: { x: 120, y: 90, label: '数据 x₁', detail: 'x₁：真实数据样本，形状 [B, d]。', color: C.blue },
  x0: { x: 120, y: 200, label: '噪声 x₀', detail: 'x₀：标准高斯噪声，形状 [B, d]。', color: C.blue },
  t: { x: 340, y: 200, label: '时间 t', detail: 't：每个样本一个时间，形状 [B]。', color: C.blue },
  xt: { x: 560, y: 145, label: '插值 x_t', detail: 'x_t：按 ψ_t 插值得到的中间样本，形状 [B, d]。', color: C.purple },
  ut: { x: 780, y: 90, label: '目标 u_t', detail: 'u_t：条件目标向量场，形状 [B, d]。', color: C.orange },
  v: { x: 780, y: 200, label: '网络 v_θ', detail: 'v_θ：U-Net 向量场网络，输出 [B, d]。', color: C.blue },
  loss: { x: 980, y: 145, label: '损失 L', detail: 'L：均方误差；整条链路没有 ODE 仿真。', color: C.green },
};

const EDGES: Array<[NodeId, NodeId]> = [
  ['x1', 'xt'],
  ['x0', 'xt'],
  ['t', 'xt'],
  ['xt', 'ut'],
  ['xt', 'v'],
  ['ut', 'loss'],
  ['v', 'loss'],
];

export const Ch8Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<NodeId>('x1');
  const [feedback, setFeedback] = useState({ text: '点选一个节点，查看它在训练链路里的作用。', cls: '' });
  const stateRef = useRef<NodeId>('x1');

  const choose = (id: NodeId) => {
    setSelected(id);
    stateRef.current = id;
    setFeedback({ text: NODES[id].detail, cls: id === 'loss' ? 'good' : '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx, time) => {
      drawField(ctx, W, H);
      ctx.save();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      EDGES.forEach(([a, b]) => {
        const na = NODES[a];
        const nb = NODES[b];
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      });
      EDGES.forEach(([a, b]) => {
        if (a === selected || b === selected) {
          drawArrow(ctx, NODES[a].x, NODES[a].y, NODES[b].x - NODES[a].x, NODES[b].y - NODES[a].y, C.blue, 3);
        }
      });
      Object.entries(NODES).forEach(([id, node]) => {
        const active = id === selected;
        const pulse = active ? 2 + Math.sin(time / 260) * 1.5 : 0;
        ctx.fillStyle = node.color;
        ctx.globalAlpha = active ? 1 : 0.55;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = active ? C.text : C.line;
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.stroke();
      });
      drawLabel(ctx, '采样', 60, 40, C.muted, 18);
      drawLabel(ctx, '回归', 900, 40, C.muted, 18);
      ctx.restore();
    },
    W,
    H
  );

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    let best: NodeId | null = null;
    let bestD = 44;
    (Object.keys(NODES) as NodeId[]).forEach((id) => {
      const d = Math.hypot(NODES[id].x - x, NODES[id].y - y);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    });
    if (best) choose(best);
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="流匹配训练管线" onClick={handleClick} />
      <div className="ctrl">
        {(Object.keys(NODES) as NodeId[]).map((id) => (
          <button key={id} type="button" className={`chip ${selected === id ? 'selected' : ''}`} aria-pressed={selected === id} onClick={() => choose(id)}>
            {NODES[id].label}
          </button>
        ))}
      </div>
      <div className="feedback">{feedback.text}</div>
    </div>
  );
};

export default Ch8Flight;
