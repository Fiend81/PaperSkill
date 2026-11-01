import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp } from '../lib/canvasKit';
import {
  C,
  drawArrow,
  drawField,
  drawGaussian,
  drawTrajectory,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;
const SIGMA_MIN = 0.08;
const PI = 1 / 3;
const X1 = [
  { x: -1.6, y: -0.7 },
  { x: 0.1, y: 1.5 },
  { x: 1.7, y: -0.6 },
];
const X0 = { x: -1.1, y: -0.9 };

const PLOT = { x: 56, y: 28, w: 968, h: 224 };
const XR = { min: -2.5, max: 2.5 };
const YR = { min: -2.2, max: 2.2 };
const sx = (x: number) => PLOT.x + ((x - XR.min) / (XR.max - XR.min)) * PLOT.w;
const sy = (y: number) => PLOT.y + PLOT.h - ((y - YR.min) / (YR.max - YR.min)) * PLOT.h;

function logNormal2d(px: number, py: number, mx: number, my: number, sigma: number) {
  const s2 = sigma * sigma;
  return -((px - mx) ** 2 + (py - my) ** 2) / (2 * s2) - Math.log(2 * Math.PI * s2);
}

function conditionalU(x: number, y: number, x1: { x: number; y: number }, t: number) {
  const denom = 1 - (1 - SIGMA_MIN) * t;
  return {
    x: (x1.x - (1 - SIGMA_MIN) * x) / denom,
    y: (x1.y - (1 - SIGMA_MIN) * y) / denom,
  };
}

function otPoint(x0: { x: number; y: number }, x1: { x: number; y: number }, t: number) {
  const s = 1 - (1 - SIGMA_MIN) * t;
  return { x: s * x0.x + t * x1.x, y: s * x0.y + t * x1.y };
}

function drawPlotFrame(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(215,222,234,0.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = PLOT.x + (PLOT.w / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, PLOT.y);
    ctx.lineTo(x, PLOT.y + PLOT.h);
    ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    const y = PLOT.y + (PLOT.h / 8) * i;
    ctx.beginPath();
    ctx.moveTo(PLOT.x, y);
    ctx.lineTo(PLOT.x + PLOT.w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx(0), PLOT.y);
  ctx.lineTo(sx(0), PLOT.y + PLOT.h);
  ctx.moveTo(PLOT.x, sy(0));
  ctx.lineTo(PLOT.x + PLOT.w, sy(0));
  ctx.stroke();
  ctx.restore();
}

const Y_PLUS = 0.5 + Math.sqrt(1.6);
const Y_MINUS = 0.5 - Math.sqrt(1.6);
function sampleY(n: number): number[] {
  return Array.from({ length: n }, () => (Math.random() < 0.5 ? Y_MINUS : Y_PLUS));
}

export const Ch3Flight: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // §3.1 state
  const [t, setT] = useState(0.5);
  const [x, setX] = useState({ x: -0.35, y: 0.55 });
  const [showWeighted, setShowWeighted] = useState(false);
  const [feedback31, setFeedback31] = useState({ text: '拖动空间位置 x，观察同一 (t,x) 处三个条件向量场如何加权成边缘向量场。', cls: '' });
  const state31 = useRef({ t: 0.5, x: { x: -0.35, y: 0.55 }, showWeighted: false });

  // §3.2 state
  const [theta, setTheta] = useState(0.2);
  const [mc, setMc] = useState(false);
  const [batch, setBatch] = useState(32);
  const [samples, setSamples] = useState<number[]>(() => sampleY(32));
  const [showDiff, setShowDiff] = useState(true);
  const [feedback32, setFeedback32] = useState({ text: '理论期望下，L_CFM 与 L_FM 只差常数 0.8；开启小批量会从 Y=0.5±√1.6 真实抽样。', cls: '' });
  const state32 = useRef({ theta: 0.2, mc: false, batch: 32, samples, showDiff: true });

  const updateT = (value: number) => {
    const v = clamp(value, 0.02, 0.95);
    state31.current.t = v;
    setT(v);
    setFeedback31({ text: '时间 t 改变后，条件均值、权重和边缘向量场都会重新计算。', cls: '' });
  };

  const updateTheta = (value: number) => {
    const v = clamp(value, -1, 1.5);
    state32.current.theta = v;
    setTheta(v);
    setFeedback32({
      text: state32.current.mc
        ? '有限样本估计：经验 CFM 曲线不必与理论 FM 保持固定差值；理论保证的是期望梯度相等。'
        : '理论期望：两条曲线只差常数 C=0.8，当前 θ 处的斜率相同。',
      cls: '',
    });
  };

  const toggleMc = () => {
    const next = !mc;
    setMc(next);
    state32.current.mc = next;
    if (next) {
      setFeedback32({ text: `已从 Y 分布真实抽取 ${batch} 个样本；单次实验不保证 batch 越大误差越小，但标准误按 1/√n 下降。`, cls: '' });
    } else {
      setFeedback32({ text: '已关闭小批量估计；绿色理论 CFM 曲线仍满足 L_CFM=L_FM+0.8。', cls: 'good' });
    }
  };

  const resample = () => {
    const next = sampleY(batch);
    setSamples(next);
    state32.current.samples = next;
    state32.current.mc = true;
    setMc(true);
    setFeedback32({ text: `已重新抽取 ${batch} 个样本；只改变有限样本估计，不改变理论期望曲线。`, cls: '' });
  };

  const chooseBatch = (n: number) => {
    const next = sampleY(n);
    setBatch(n);
    setSamples(next);
    state32.current.batch = n;
    state32.current.samples = next;
    state32.current.mc = true;
    setMc(true);
    setFeedback32({ text: `batch=${n}；标准误约为 √(1.6/n)=${Math.sqrt(1.6 / n).toFixed(3)}。单次样本均值仍有随机波动。`, cls: '' });
  };

  const reset32 = () => {
    const next = sampleY(32);
    state32.current = { theta: 0.2, mc: false, batch: 32, samples: next, showDiff: true };
    setTheta(0.2);
    setMc(false);
    setBatch(32);
    setSamples(next);
    setShowDiff(true);
    setFeedback32({ text: '已重置：θ=0.20，关闭小批量，batch=32，显示差值。', cls: '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx, time) => {
      drawField(ctx, W, H);
      if (moduleId === '3.1') {
        const s = state31.current;
        const sigma = 1 - (1 - SIGMA_MIN) * s.t;
        const logps = X1.map((x1) => logNormal2d(s.x.x, s.x.y, s.t * x1.x, s.t * x1.y, sigma));
        const maxLog = Math.max(...logps);
        const exps = logps.map((l) => Math.exp(l - maxLog));
        const total = exps.reduce((a, b) => a + b, 0);
        const weights = exps.map((v) => v / total);
        const us = X1.map((x1) => conditionalU(s.x.x, s.x.y, x1, s.t));
        const u = {
          x: us.reduce((sum, ui, i) => sum + weights[i] * ui.x, 0),
          y: us.reduce((sum, ui, i) => sum + weights[i] * ui.y, 0),
        };
        const maxLen = Math.max(1e-9, ...us.map((v) => Math.hypot(v.x, v.y)), Math.hypot(u.x, u.y));
        const scale = 160 / maxLen;

        drawPlotFrame(ctx);
        X1.forEach((x1, i) => {
          const pts: Array<{ x: number; y: number }> = [];
          for (let k = 0; k <= 30; k++) {
            const p = otPoint(X0, x1, k / 30);
            pts.push({ x: sx(p.x), y: sy(p.y) });
          }
          drawTrajectory(ctx, pts, C.line, true, 1.5);
          ctx.fillStyle = 'rgba(34,141,92,0.9)';
          ctx.beginPath();
          ctx.arc(sx(x1.x), sy(x1.y), 5, 0, Math.PI * 2);
          ctx.fill();
          drawGaussian(ctx, sx(s.t * x1.x), sy(s.t * x1.y), (sigma / 5) * PLOT.w, (sigma / 4.4) * PLOT.h, C.blue);
          const v = s.showWeighted ? { x: weights[i] * us[i].x, y: weights[i] * us[i].y } : us[i];
          drawArrow(
            ctx,
            sx(s.x.x),
            sy(s.x.y),
            v.x * scale,
            -v.y * scale,
            [C.blue, C.purple, C.orange][i],
            s.showWeighted ? 3.5 : 2.5
          );
        });
        drawArrow(ctx, sx(s.x.x), sy(s.x.y), u.x * scale, -u.y * scale, '#ffffff', 10);
        drawArrow(ctx, sx(s.x.x), sy(s.x.y), u.x * scale, -u.y * scale, C.red, 6);
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(sx(s.x.x) + u.x * scale, sy(s.x.y) - u.y * scale, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(sx(s.x.x), sy(s.x.y), 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.text;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('x', sx(s.x.x) - 22, sy(s.x.y) + 28);
        ctx.fillStyle = C.red;
        ctx.fillText('u_t(x)', sx(s.x.x) + u.x * scale + 10, sy(s.x.y) - u.y * scale - 12);
        (ctx.canvas as HTMLCanvasElement).dataset.weights = weights.map((w) => w.toFixed(6)).join(',');
        (ctx.canvas as HTMLCanvasElement).dataset.u = `${u.x.toFixed(6)},${u.y.toFixed(6)}`;
        (ctx.canvas as HTMLCanvasElement).dataset.scale = scale.toFixed(6);
        (ctx.canvas as HTMLCanvasElement).dataset.mode = s.showWeighted ? 'weighted' : 'raw';
        void time;
      } else {
        const s = state32.current;
        const fm = (th: number) => 0.5 * (th - 0.5) ** 2;
        const theoretical = (th: number) => fm(th) + 0.8;
        const empirical = (th: number) => (0.5 * s.samples.reduce((sum, y) => sum + (th - y) ** 2, 0)) / s.samples.length;
        const thetaMin = -1;
        const thetaMax = 1.5;
        const lossMax = 3.2;
        const px = (th: number) => 60 + ((th - thetaMin) / (thetaMax - thetaMin)) * 960;
        const py = (loss: number) => 248 - (Math.min(loss, lossMax) / lossMax) * 210;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.94)';
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(50, 24, 980, 236);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
          const gx = px(thetaMin + ((thetaMax - thetaMin) / 8) * i);
          ctx.beginPath();
          ctx.moveTo(gx, 30);
          ctx.lineTo(gx, 254);
          ctx.stroke();
        }
        for (let j = 0; j <= 6; j++) {
          const gy = 248 - (216 / 6) * j;
          ctx.beginPath();
          ctx.moveTo(54, gy);
          ctx.lineTo(1026, gy);
          ctx.stroke();
        }
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px(0), 30);
        ctx.lineTo(px(0), 254);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(54, py(0));
        ctx.lineTo(1026, py(0));
        ctx.stroke();

        const drawCurve = (fn: (th: number) => number, color: string, width: number, dashed = false) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.setLineDash(dashed ? [8, 7] : []);
          ctx.beginPath();
          for (let i = 0; i <= 160; i++) {
            const th = thetaMin + ((thetaMax - thetaMin) * i) / 160;
            const gx = px(th);
            const gy = py(fn(th));
            if (i === 0) ctx.moveTo(gx, gy);
            else ctx.lineTo(gx, gy);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        };
        drawCurve(fm, C.blue, 3);
        drawCurve(theoretical, C.green, 3);
        if (s.mc) drawCurve(empirical, C.orange, 2.5, true);

        const th = s.theta;
        const fmVal = fm(th);
        const cfmVal = theoretical(th);
        const slope = th - 0.5;
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px(th), 30);
        ctx.lineTo(px(th), 254);
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(px(th), py(fmVal), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(px(th), py(cfmVal), 6, 0, Math.PI * 2);
        ctx.fill();
        if (s.mc) {
          ctx.fillStyle = C.orange;
          ctx.beginPath();
          ctx.arc(px(th), py(empirical(th)), 6, 0, Math.PI * 2);
          ctx.fill();
        }

        const drawTangent = (x0: number, y0: number, m: number, color: string, dashed = false) => {
          const d = 0.28;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.setLineDash(dashed ? [5, 5] : []);
          ctx.beginPath();
          ctx.moveTo(px(x0 - d), py(y0 - m * d));
          ctx.lineTo(px(x0 + d), py(y0 + m * d));
          ctx.stroke();
          ctx.setLineDash([]);
        };
        drawTangent(th, fmVal, slope, C.blue);
        drawTangent(th, cfmVal, slope, C.green);

        if (s.showDiff) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(px(th) + 8, py(fmVal));
          ctx.lineTo(px(th) + 8, py(cfmVal));
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = C.blue;
        ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('FM', 70, 48);
        ctx.fillStyle = C.green;
        ctx.fillText('CFM', 70, 72);
        ctx.restore();
        (ctx.canvas as HTMLCanvasElement).dataset.theta = th.toFixed(4);
        (ctx.canvas as HTMLCanvasElement).dataset.fm = fmVal.toFixed(6);
        (ctx.canvas as HTMLCanvasElement).dataset.cfm = cfmVal.toFixed(6);
        (ctx.canvas as HTMLCanvasElement).dataset.empirical = s.mc ? empirical(th).toFixed(6) : '';
        (ctx.canvas as HTMLCanvasElement).dataset.mc = String(s.mc);
        (ctx.canvas as HTMLCanvasElement).dataset.batch = String(s.batch);
        void time;
      }
    },
    W,
    H
  );

  if (moduleId === '3.2') {
    const fm = 0.5 * (theta - 0.5) ** 2;
    const cfm = fm + 0.8;
    const ybar = samples.reduce((a, b) => a + b, 0) / samples.length;
    const empirical = (0.5 * samples.reduce((sum, y) => sum + (theta - y) ** 2, 0)) / samples.length;
    const theoryGrad = theta - 0.5;
    const empiricalGrad = theta - ybar;
    const se = Math.sqrt(1.6 / batch);

    return (
      <div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="FM 与 CFM 损失曲线、真实伯努利小批量估计"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * W;
            const th = -1 + ((x - 60) / 960) * 2.5;
            updateTheta(th);
          }}
        />
        <div className="ctrl">
          <label>
            θ <span className="val">{theta.toFixed(2)}</span>
          </label>
          <input type="range" min={-100} max={150} value={Math.round(theta * 100)} onChange={(e) => updateTheta(Number(e.target.value) / 100)} />
          <button type="button" onClick={toggleMc}>
            {mc ? '关闭小批量' : '开启小批量'}
          </button>
          <button type="button" onClick={resample}>重新采样</button>
          {[8, 32, 128].map((n) => (
            <button key={n} type="button" className={`chip ${batch === n ? 'selected' : ''}`} aria-pressed={batch === n} onClick={() => chooseBatch(n)}>
              batch {n}
            </button>
          ))}
          <button type="button" className={`chip ${showDiff ? 'selected' : ''}`} aria-pressed={showDiff} onClick={() => { setShowDiff(!showDiff); state32.current.showDiff = !showDiff; }}>
            显示差值
          </button>
          <button type="button" onClick={reset32}>重置</button>
        </div>
        <div className="fm-readout">
          <div><span className="k">θ</span> {theta.toFixed(3)}</div>
          <div><span className="k">L_FM</span> {fm.toFixed(3)}</div>
          <div><span className="k">L_CFM 理论</span> {cfm.toFixed(3)}</div>
          <div><span className="k">L_CFM 经验</span> {mc ? empirical.toFixed(3) : '—'}</div>
          <div><span className="k">dL_FM/dθ</span> {theoryGrad.toFixed(3)}</div>
          <div><span className="k">dL_CFM/dθ 理论</span> {theoryGrad.toFixed(3)}</div>
          <div><span className="k">经验梯度</span> {mc ? empiricalGrad.toFixed(3) : '—'}</div>
          <div><span className="k">样本均值</span> {mc ? ybar.toFixed(3) : '—'}</div>
          <div><span className="k">标准误</span> {mc ? se.toFixed(3) : '—'}</div>
          <div><span className="k">理论差</span> {(cfm - fm).toFixed(3)}</div>
          <div><span className="k">经验差</span> {mc ? (empirical - fm).toFixed(3) : '—'}</div>
        </div>
        <div className="fm-legend">
          <span><i style={{ background: C.blue }} />FM 理论</span>
          <span><i style={{ background: C.green }} />CFM 理论（差 0.8）</span>
          <span><i style={{ background: C.orange }} />CFM 经验（虚线）</span>
        </div>
        <p className="fm-note">
          玩具条件回归：Y=0.5+ε，P(ε=±√1.6)=0.5，因此 L_CFM(θ)=0.5E[(θ−Y)²]=L_FM(θ)+0.8。开启小批量后，页面从该分布真实抽取 n 个样本并计算经验损失/梯度；<strong>单次实验不保证 batch 越大误差越小</strong>，但标准误按 1/√n 下降。理论保证的是期望梯度相等，不是每条有限样本曲线都与理论 FM 保持固定差值。这里不是论文真实训练曲线。
        </p>
        <div className={`feedback ${feedback32.cls}`}>{feedback32.text}</div>
      </div>
    );
  }

  const sigma = 1 - (1 - SIGMA_MIN) * t;
  const logps = X1.map((x1) => logNormal2d(x.x, x.y, t * x1.x, t * x1.y, sigma));
  const maxLog = Math.max(...logps);
  const exps = logps.map((l) => Math.exp(l - maxLog));
  const total = exps.reduce((a, b) => a + b, 0);
  const weights = exps.map((v) => v / total);
  const us = X1.map((x1) => conditionalU(x.x, x.y, x1, t));
  const u = {
    x: us.reduce((sum, ui, i) => sum + weights[i] * ui.x, 0),
    y: us.reduce((sum, ui, i) => sum + weights[i] * ui.y, 0),
  };
  const maxLen = Math.max(1e-9, ...us.map((v) => Math.hypot(v.x, v.y)), Math.hypot(u.x, u.y));
  const scale = 160 / maxLen;

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="二维混合高斯的条件向量场加权聚合"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const py = ((e.clientY - rect.top) / rect.height) * H;
          const nx = XR.min + ((px - PLOT.x) / PLOT.w) * (XR.max - XR.min);
          const ny = YR.max - ((py - PLOT.y) / PLOT.h) * (YR.max - YR.min);
          const next = { x: clamp(nx, XR.min, XR.max), y: clamp(ny, YR.min, YR.max) };
          setX(next);
          state31.current.x = next;
          setFeedback31({ text: '空间位置 x 改变后，同一位置的条件向量场和后验权重会重新计算。', cls: '' });
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const py = ((e.clientY - rect.top) / rect.height) * H;
          const nx = XR.min + ((px - PLOT.x) / PLOT.w) * (XR.max - XR.min);
          const ny = YR.max - ((py - PLOT.y) / PLOT.h) * (YR.max - YR.min);
          const next = { x: clamp(nx, XR.min, XR.max), y: clamp(ny, YR.min, YR.max) };
          setX(next);
          state31.current.x = next;
        }}
      />
      <div className="ctrl">
        <label>
          时间 t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input type="range" min={2} max={95} value={Math.round(t * 100)} onChange={(e) => updateT(Number(e.target.value) / 100)} />
        <button type="button" className={`chip ${showWeighted ? 'selected' : ''}`} aria-pressed={showWeighted} onClick={() => { setShowWeighted(!showWeighted); state31.current.showWeighted = !showWeighted; }}>
          {showWeighted ? '显示条件场' : '显示加权分量'}
        </button>
      </div>
      <div className="fm-readout">
        <div><span className="k">t</span> {t.toFixed(2)}</div>
        <div><span className="k">σ_t</span> {sigma.toFixed(3)}</div>
        <div><span className="k">x</span> ({x.x.toFixed(2)}, {x.y.toFixed(2)})</div>
        <div><span className="k">u_t(x)</span> ({u.x.toFixed(3)}, {u.y.toFixed(3)})</div>
        <div><span className="k">最大模长</span> {maxLen.toFixed(3)}</div>
        <div><span className="k">箭头比例</span> {scale.toFixed(1)} px/单位</div>
      </div>
      <div className="fm-weights">
        {weights.map((w, i) => (
          <div key={i} className="fm-weight">
            <span>w{i + 1}</span>
            <div className="fm-weight-bar"><span style={{ width: `${w * 100}%`, background: [C.blue, C.purple, C.orange][i] }} /></div>
            <span>{w.toFixed(3)}</span>
          </div>
        ))}
      </div>
      <div className="fm-legend">
        <span><i style={{ background: C.blue }} />条件场 1</span>
        <span><i style={{ background: C.purple }} />条件场 2</span>
        <span><i style={{ background: C.orange }} />条件场 3</span>
        <span><i style={{ background: C.red }} />加权边缘场 u_t</span>
      </div>
      <p className="fm-formula">w_i(t,x)=π_i p_t(x|x_i) / Σ_j π_j p_t(x|x_j)</p>
      <p className="fm-formula">u_t(x)=Σ_i w_i(t,x) u_t(x|x_i)</p>
      <p className="fm-note">
        {showWeighted ? '当前显示 w_i u_t(x|x_i) 加权分量；红色箭头是它们的合成。' : '当前显示原始条件场 u_t(x|x_i)；点击“显示加权分量”可分别查看 w_i u_t(x|x_i)。'} 所有箭头共用同一比例 {scale.toFixed(1)} px/单位，最大模长 {maxLen.toFixed(3)}；没有对每根箭头单独归一化。三条细线是从固定噪声点 x0 到三个数据样本的条件轨迹，仅作几何参考；边缘向量场是同一 (t,x) 处的加权和。权重用 log-density + log-sum-exp 计算，避免密度下溢。
      </p>
      <div className={`feedback ${feedback31.cls}`}>{feedback31.text}</div>
    </div>
  );
};

export default Ch3Flight;
