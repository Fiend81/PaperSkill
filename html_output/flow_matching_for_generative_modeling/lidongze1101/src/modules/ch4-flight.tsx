import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawArrow,
  drawField,
  drawLabel,
  drawPlane,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;
const X0 = -1.0;
const X1 = 1.0;

function gaussianPdf(x: number, mu: number, sigma: number) {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (Math.sqrt(2 * Math.PI) * sigma);
}

export const Ch4Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sigmaMin, setSigmaMin] = useState(0.1);
  const [t, setT] = useState(0.45);
  const [autoScale, setAutoScale] = useState(true);
  const [feedback, setFeedback] = useState({ text: '调节 σ_min 与 t，观察条件向量场的实际方向和大小如何变化。', cls: '' });
  const stateRef = useRef({ sigmaMin: 0.1, t: 0.45 });

  const updateSigma = (value: number) => {
    const v = Math.max(0.02, Math.min(0.5, value));
    stateRef.current.sigmaMin = v;
    setSigmaMin(v);
    if (v < 0.05) setFeedback({ text: 'σ_min 很小：终端分布很窄，末段条件向量场会更集中。', cls: '' });
    else if (v <= 0.2) setFeedback({ text: '这是常用的终端宽度范围；向量场由公式实时计算。', cls: 'good' });
    else setFeedback({ text: 'σ_min 较大：终点分布较宽，样本终点不够集中。', cls: '' });
  };

  const updateT = (value: number) => {
    const v = Math.max(0.02, Math.min(0.95, value));
    stateRef.current.t = v;
    setT(v);
    setFeedback({ text: '时间 t 改变后，条件均值、标准差和条件向量场同时重新计算。', cls: '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx) => {
      const s = stateRef.current;
      const sigma = 1 - (1 - s.sigmaMin) * s.t;
      const mu = s.t * X1;
      const psi = sigma * X0 + mu;
      const peakNow = gaussianPdf(mu, mu, sigma);
      const yMax = autoScale ? Math.max(0.8, peakNow * 1.15) : 9.5;
      const denominator = 1 - (1 - s.sigmaMin) * s.t;
      const uAt = (x: number) => (X1 - (1 - s.sigmaMin) * x) / denominator;
      const uPsi = uAt(psi);
      const dpsi = X1 - (1 - s.sigmaMin) * X0;
      drawField(ctx, W, H);

      const plot = { x: 54, y: 30, w: 970, h: 218 };
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(plot.x, plot.y, plot.w, plot.h);
      ctx.fill();
      ctx.stroke();
      const px = (x: number) => plot.x + ((x + 2.5) / 5) * plot.w;
      const pyDensity = (y: number) => plot.y + 120 - (Math.min(yMax, y) / yMax) * 100;
      const axisY = plot.y + 196;
      ctx.strokeStyle = 'rgba(215,222,234,0.8)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const gx = plot.x + (plot.w / 10) * i;
        ctx.beginPath();
        ctx.moveTo(gx, plot.y);
        ctx.lineTo(gx, plot.y + plot.h);
        ctx.stroke();
      }
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plot.x, axisY);
      ctx.lineTo(plot.x + plot.w, axisY);
      ctx.stroke();

      // Normalized density on the upper half.
      ctx.beginPath();
      ctx.moveTo(px(-2.5), pyDensity(0));
      for (let i = 0; i <= 220; i++) {
        const x = -2.5 + (5 * i) / 220;
        ctx.lineTo(px(x), pyDensity(gaussianPdf(x, mu, sigma)));
      }
      ctx.lineTo(px(2.5), pyDensity(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 220; i++) {
        const x = -2.5 + (5 * i) / 220;
        const xx = px(x);
        const yy = pyDensity(gaussianPdf(x, mu, sigma));
        if (i === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();

      // Conditional vector field at several positions; actual formula, not preset offsets.
      [-1.8, -1.0, -0.2, 0.6, 1.4, 2.0].forEach((x) => {
        const u = uAt(x);
        const signed = Math.sign(u) * Math.min(78, Math.abs(u) * 18);
        if (Math.abs(signed) > 1) drawArrow(ctx, px(x), axisY, signed, 0, C.muted, 2);
      });
      // Highlight the vector at the fixed sample's flow position.
      const signedPsi = Math.sign(uPsi) * Math.min(100, Math.abs(uPsi) * 18);
      drawArrow(ctx, px(psi), axisY, signedPsi, 0, C.orange, 4);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(px(psi), axisY, 6, 0, Math.PI * 2);
      ctx.fill();
      drawPlane(ctx, px(psi), axisY - 20, 0, 0.75, C.orange);
      drawLabel(ctx, '密度', plot.x + 10, plot.y + 20, C.muted, 17);
      drawLabel(ctx, 'u_t', plot.x + 10, axisY + 24, C.muted, 17);
      ctx.restore();
    },
    W,
    H
  );

  const sigma = 1 - (1 - sigmaMin) * t;
  const mu = t * X1;
  const psi = sigma * X0 + mu;
  const denominator = 1 - (1 - sigmaMin) * t;
  const uPsi = (X1 - (1 - sigmaMin) * psi) / denominator;
  const dpsi = X1 - (1 - sigmaMin) * X0;
  const diff = Math.abs(uPsi - dpsi);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="OT 条件向量场、σ_min 与时间 t 的真实计算" />
      <div className="ctrl">
        <label>
          σ_min <span className="val">{sigmaMin.toFixed(2)}</span>
        </label>
        <input type="range" min={2} max={50} value={Math.round(sigmaMin * 100)} onChange={(e) => updateSigma(Number(e.target.value) / 100)} />
        <label>
          t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input type="range" min={2} max={95} value={Math.round(t * 100)} onChange={(e) => updateT(Number(e.target.value) / 100)} />
        <button type="button" className={`chip ${autoScale ? 'selected' : ''}`} aria-pressed={autoScale} onClick={() => setAutoScale(!autoScale)}>
          {autoScale ? '自适应刻度' : '固定刻度'}
        </button>
      </div>
      <div className="fm-readout">
        <div><span className="k">σ_t</span> {sigma.toFixed(3)}</div>
        <div><span className="k">μ_t</span> {mu.toFixed(3)}</div>
        <div><span className="k">纵轴</span> 0–{(autoScale ? Math.max(0.8, gaussianPdf(mu, mu, sigma) * 1.15) : 9.5).toFixed(2)}</div>
        <div><span className="k">ψ_t(x₀)</span> {psi.toFixed(3)}</div>
        <div><span className="k">u_t(ψ_t)</span> {uPsi.toFixed(3)}</div>
        <div><span className="k">dψ_t/dt</span> {dpsi.toFixed(3)}</div>
        <div><span className="k">|差|</span> {diff.toExponential(2)}</div>
      </div>
      <p className="fm-note">
        图中箭头由 OT 公式 u_t(x|x₁)=(x₁−(1−σ_min)x)/(1−(1−σ_min)t) 实时计算，不是预设长度。σ_t=1−(1−σ_min)t{'>'}0。当前高亮箭头满足 u_t(ψ_t(x₀)|x₁)=dψ_t/dt，数值差应接近 0。此式中的向量场是由所选仿射高斯流映射唯一确定的条件向量场，但并不是能够生成该高斯概率路径的唯一向量场。
      </p>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Flight;
