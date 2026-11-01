import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawField,
  drawLabel,
  drawPlane,
  drawTarget,
  drawTrajectory,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;
const X0 = { x: -1.4, y: 0.8 };
const X1 = { x: 1.5, y: 0.8 };
// Keep the paper's positive terminal standard deviation. The OT conditional
// endpoint is x1 + sigma_min*x0 (a narrow Gaussian around x1), not a point mass.
const SIGMA_MIN = 0.05;

// VP diffusion schedule used in Appendix E: beta(s)=beta_min+s(beta_max-beta_min).
function T(s: number) {
  return 0.1 * s + 0.5 * (20 - 0.1) * s * s;
}
function alpha(s: number) {
  return Math.exp(-0.5 * T(s));
}
function diffusionPoint(t: number) {
  const a = alpha(1 - t);
  const sigma = Math.sqrt(Math.max(0, 1 - a * a));
  return { x: sigma * X0.x + a * X1.x, y: sigma * X0.y + a * X1.y };
}
function otPoint(t: number) {
  const s = 1 - (1 - SIGMA_MIN) * t;
  return { x: s * X0.x + t * X1.x, y: s * X0.y + t * X1.y };
}

const DIFF_POINTS = Array.from({ length: 121 }, (_, i) => diffusionPoint(i / 120));
const OT_POINTS = Array.from({ length: 121 }, (_, i) => otPoint(i / 120));

function pathLength(points: Array<{ x: number; y: number }>) {
  let len = 0;
  for (let i = 1; i < points.length; i++) len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return len;
}

function maxDeviationFromOwnLine(points: Array<{ x: number; y: number }>) {
  const a = points[0];
  const b = points[points.length - 1];
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const norm = Math.hypot(vx, vy);
  return Math.max(
    ...points.map((p) => {
      const wx = p.x - a.x;
      const wy = p.y - a.y;
      return Math.abs(wx * vy - wy * vx) / norm;
    })
  );
}

function plotPoint(p: { x: number; y: number }, box: { x: number; y: number; w: number; h: number }, xr: [number, number], yr: [number, number]) {
  return {
    x: box.x + ((p.x - xr[0]) / (xr[1] - xr[0])) * box.w,
    y: box.y + box.h - ((p.y - yr[0]) / (yr[1] - yr[0])) * box.h,
  };
}

export const Ch5Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '按下按钮，用同一潜在样本 x₀、x₁ 比较 VP 扩散条件流与 OT 条件流；实际 t=0 位置与 t=1 端点需按公式分别判断。', cls: '' });
  const stateRef = useRef({ running: false, progress: 0, last: 0 });

  const start = () => {
    stateRef.current.running = true;
    stateRef.current.progress = 0;
    stateRef.current.last = 0;
    setRunning(true);
    setFeedback({ text: '两条轨迹使用相同的潜在 x₀/x₁；VP 有限时间起点略有偏移，OT 的 t=1 端点是 x₁ 附近的窄高斯，不是点质量。', cls: '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx, time) => {
      const s = stateRef.current;
      if (s.running) {
        if (!s.last) s.last = time;
        s.progress = Math.min(1, s.progress + (time - s.last) / 2200);
        s.last = time;
        if (s.progress >= 1) {
          s.running = false;
          setRunning(false);
          const ld = pathLength(DIFF_POINTS);
          const lo = pathLength(OT_POINTS);
          setFeedback({ text: `同一潜在样本 x0/x1：OT 条件轨迹为直线（长度 ${lo.toFixed(3)}），端点在 x1 附近的窄高斯内；扩散条件流弯曲（长度 ${ld.toFixed(3)}，有限时间起点略有偏移）。`, cls: 'good' });
        }
      }
      drawField(ctx, W, H);
      const boxes = [
        { x: 24, y: 30, w: 500, h: 220, label: '扩散', color: C.red, pts: DIFF_POINTS },
        { x: 556, y: 30, w: 500, h: 220, label: 'OT', color: C.green, pts: OT_POINTS },
      ];
      const xr: [number, number] = [-1.8, 1.6];
      const yr: [number, number] = [-0.9, 0.9];
      boxes.forEach((box) => {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.93)';
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.w, box.h);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(215,222,234,0.8)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
          const gx = box.x + (box.w / 8) * i;
          ctx.beginPath();
          ctx.moveTo(gx, box.y);
          ctx.lineTo(gx, box.y + box.h);
          ctx.stroke();
        }
        for (let j = 0; j <= 6; j++) {
          const gy = box.y + (box.h / 6) * j;
          ctx.beginPath();
          ctx.moveTo(box.x, gy);
          ctx.lineTo(box.x + box.w, gy);
          ctx.stroke();
        }
        const pts = box.pts.map((p) => plotPoint(p, box, xr, yr));
        drawTrajectory(ctx, pts, box.color, false, 3.5);
        const startP = plotPoint(X0, box, xr, yr);
        const endP = plotPoint(X1, box, xr, yr);
        const actualStart = pts[0];
        const actualEnd = pts[120];
        ctx.fillStyle = C.muted;
        ctx.beginPath();
        ctx.arc(startP.x, startP.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(actualStart.x, actualStart.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        drawTarget(ctx, endP.x, endP.y, 15, s.progress >= 1);
        ctx.strokeStyle = C.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(actualEnd.x, actualEnd.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        const idx = Math.max(0, Math.min(120, Math.round(s.progress * 120)));
        const cur = pts[idx];
        const next = pts[Math.min(120, idx + 1)];
        drawPlane(ctx, cur.x, cur.y, Math.atan2(next.y - cur.y, next.x - cur.x), 0.8, box.color);
        drawLabel(ctx, box.label, box.x + 10, box.y + 22, box.color, 18);
        ctx.restore();
      });
    },
    W,
    H
  );

  const ld = pathLength(DIFF_POINTS);
  const lo = pathLength(OT_POINTS);
  const dd = maxDeviationFromOwnLine(DIFF_POINTS);
  const doff = maxDeviationFromOwnLine(OT_POINTS);
  const otEndpointOffset = Math.hypot(OT_POINTS[120].x - X1.x, OT_POINTS[120].y - X1.y);
  const diffusionStartOffset = Math.hypot(DIFF_POINTS[0].x - X0.x, DIFF_POINTS[0].y - X0.y);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="VP 扩散条件流与 OT 条件流的真实二维对比" />
      <div className="ctrl">
        <button type="button" onClick={start} disabled={running}>
          {running ? '比较中…' : '同时放飞'}
        </button>
      </div>
      <div className="fm-readout">
        <div><span className="k">扩散路径长度</span> {ld.toFixed(3)}</div>
        <div><span className="k">OT 路径长度</span> {lo.toFixed(3)}</div>
        <div><span className="k">扩散相对自身直线偏离</span> {dd.toFixed(3)}</div>
        <div><span className="k">OT 相对自身直线偏离</span> {doff.toExponential(2)}</div>
        <div><span className="k">OT 端点偏移 |ψ₁−x₁|</span> {otEndpointOffset.toFixed(3)}</div>
        <div><span className="k">扩散起点偏移</span> {diffusionStartOffset.toFixed(3)}</div>
      </div>
      <p className="fm-note">
        两条轨迹使用相同的潜在样本 x₀=({X0.x}, {X0.y}) 和 x₁=({X1.x}, {X1.y})：扩散使用论文 Appendix E 的 VP 调度 β(s)=0.1+19.9s，OT 使用 ψ_t=(1−(1−σ_min)t)x₀+t x₁，并保留论文要求的正终端标准差 σ_min=0.05。OT 条件路径仍是直线，但 t=1 端点是 x₁+σ_min x₀，落在 x₁ 附近的窄高斯内，而不是点质量；因此目标环画在均值 x₁，空心圈标出实际端点。VP 扩散在有限时间只近似噪声，所以其 t=0 起点相比 x₀ 也有微小偏移。两者都是<strong>条件流</strong>，不是边缘样本轨迹，也不是训练好的 ImageNet 模型。Figure 2 上方对比的是 diffusion conditional score function 与 OT conditional vector field，二者不是同类对象，不能直接数值比较；条件 OT 最优也不等于边缘/全局 OT 最优。
      </p>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Flight;
