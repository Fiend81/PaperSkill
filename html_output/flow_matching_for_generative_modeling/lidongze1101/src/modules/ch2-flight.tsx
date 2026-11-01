import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawField,
  drawLabel,
  drawTarget,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;
const X1 = 1.0;
const SIGMA_MIN = 0.05;
const X0_OPTIONS = [-1.2, -0.8, 0.3];
const XR = { min: -2.5, max: 2.5 };

function gaussianPdf(x: number, mu: number, sigma: number) {
  const s2 = sigma * sigma;
  return Math.exp(-((x - mu) ** 2) / (2 * s2)) / (Math.sqrt(2 * Math.PI) * sigma);
}

export const Ch2Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [t, setT] = useState(0);
  const [x0, setX0] = useState(-0.8);
  const [autoScale, setAutoScale] = useState(true);
  const [feedback, setFeedback] = useState({ text: '拖动时间 t，观察高斯密度的均值、标准差和峰值如何随时间变化。', cls: '' });
  const stateRef = useRef({ t: 0, x0: -0.8 });

  const updateT = (value: number) => {
    const v = Math.max(0, Math.min(1, value));
    stateRef.current.t = v;
    setT(v);
    if (v < 0.2) setFeedback({ text: 't 接近 0：均值接近 0，标准差接近 1，归一化密度峰值较低。', cls: '' });
    else if (v < 0.8) setFeedback({ text: '中间时刻：均值向 x₁ 移动，标准差缩小，峰值开始升高。', cls: '' });
    else setFeedback({ text: 't 接近 1：均值接近 x₁，标准差接近 σ_min，峰值显著升高。', cls: 'good' });
  };

  const chooseX0 = (value: number) => {
    stateRef.current.x0 = value;
    setX0(value);
    setFeedback({ text: `固定噪声样本 x₀=${value.toFixed(1)}；它沿仿射流 ψ_t(x₀) 移动，与分布均值不同。`, cls: '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx) => {
      const s = stateRef.current;
      const sigma = 1 - (1 - SIGMA_MIN) * s.t;
      const mu = s.t * X1;
      const psi = sigma * s.x0 + mu;
      const peakNow = 1 / (Math.sqrt(2 * Math.PI) * sigma);
      const yMax = autoScale ? Math.max(0.5, peakNow * 1.15) : 9.5;
      drawField(ctx, W, H);
      const plot = { x: 54, y: 34, w: 970, h: 208 };
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(plot.x, plot.y, plot.w, plot.h);
      ctx.fill();
      ctx.stroke();
      const px = (x: number) => plot.x + ((x - XR.min) / (XR.max - XR.min)) * plot.w;
      const py = (y: number) => plot.y + plot.h - (y / yMax) * plot.h;
      // Axes and grid.
      ctx.strokeStyle = 'rgba(215,222,234,0.8)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const gx = plot.x + (plot.w / 10) * i;
        ctx.beginPath();
        ctx.moveTo(gx, plot.y);
        ctx.lineTo(gx, plot.y + plot.h);
        ctx.stroke();
      }
      for (let j = 0; j <= 8; j++) {
        const gy = plot.y + (plot.h / 8) * j;
        ctx.beginPath();
        ctx.moveTo(plot.x, gy);
        ctx.lineTo(plot.x + plot.w, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plot.x, py(0));
      ctx.lineTo(plot.x + plot.w, py(0));
      ctx.stroke();
      // Normalized density, with the true peak height 1/(sqrt(2pi) sigma).
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= 260; i++) {
        const x = XR.min + ((XR.max - XR.min) * i) / 260;
        pts.push({ x: px(x), y: py(gaussianPdf(x, mu, sigma)) });
      }
      ctx.beginPath();
      ctx.moveTo(px(XR.min), py(0));
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(px(XR.max), py(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      // Mean, fixed-sample flow position, and target.
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(px(mu), py(0));
      ctx.lineTo(px(mu), py(gaussianPdf(mu, mu, sigma)));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(px(mu), py(0), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(px(psi), py(0), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawTarget(ctx, px(X1), py(0), 14, sigma < 0.12);
      drawLabel(ctx, 'x', plot.x + plot.w - 16, py(0) - 10, C.muted, 17);
      drawLabel(ctx, '密度', plot.x + 10, plot.y + 20, C.muted, 17);
      ctx.restore();
    },
    W,
    H
  );

  const sigma = 1 - (1 - SIGMA_MIN) * t;
  const mu = t * X1;
  const psi = sigma * x0 + mu;
  const peak = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  const pAtPsi = gaussianPdf(psi, mu, sigma);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="高斯条件路径的归一化密度与流位置" />
      <div className="ctrl">
        <label>
          时间 t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(t * 100)} onChange={(e) => updateT(Number(e.target.value) / 100)} />
        {X0_OPTIONS.map((value) => (
          <button key={value} type="button" className={`chip ${x0 === value ? 'selected' : ''}`} aria-pressed={x0 === value} onClick={() => chooseX0(value)}>
            x₀={value.toFixed(1)}
          </button>
        ))}
        <button type="button" className={`chip ${autoScale ? 'selected' : ''}`} aria-pressed={autoScale} onClick={() => setAutoScale(!autoScale)}>
          {autoScale ? '自适应刻度' : '固定刻度'}
        </button>
      </div>
      <div className="fm-readout">
        <div><span className="k">t</span> {t.toFixed(2)}</div>
        <div><span className="k">μ_t</span> {mu.toFixed(3)}</div>
        <div><span className="k">σ_t</span> {sigma.toFixed(3)}</div>
        <div><span className="k">峰值</span> {peak.toFixed(3)}</div>
        <div><span className="k">纵轴</span> 0–{(autoScale ? Math.max(0.5, peak * 1.15) : 9.5).toFixed(2)}</div>
        <div><span className="k">ψ_t(x₀)</span> {psi.toFixed(3)}</div>
        <div><span className="k">p_t(ψ_t)</span> {pAtPsi.toFixed(3)}</div>
      </div>
      <p className="fm-note">
        曲线是真实归一化高斯密度 p_t(x|x₁)=N(x|μ_t,σ_t²)，峰值高度为 1/(√(2π)σ_t)，随 σ_t 变化，并非固定高度。蓝色虚线是分布均值 μ_t；橙色纸飞机是固定噪声样本 x₀ 的流位置 ψ_t(x₀)=σ_t x₀+μ_t；两者不是同一个对象。这里使用 OT 特例 μ_t=t x₁、σ_t=1−(1−σ_min)t。
      </p>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Flight;
