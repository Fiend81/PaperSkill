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
const START = { x: -1.35, y: 0.95 };
const REF_STEPS = 4096;
const STEP_OPTIONS = [4, 8, 16, 32, 64];
const ERROR_STEPS = [2, 4, 8, 16, 32, 64];

type Solver = 'euler' | 'midpoint' | 'rk4';
type Point = { x: number; y: number };

// Teaching toy vector field: smooth, time-dependent, and not from the paper.
function field(t: number, p: Point): Point {
  return {
    x: -0.65 * p.x + 0.85 * Math.sin(1.2 * t) + 0.15,
    y: -0.45 * p.y - 0.55 * Math.cos(0.9 * t) + 0.1,
  };
}

function rk4Step(t: number, p: Point, h: number): Point {
  const k1 = field(t, p);
  const k2 = field(t + h / 2, { x: p.x + (h / 2) * k1.x, y: p.y + (h / 2) * k1.y });
  const k3 = field(t + h / 2, { x: p.x + (h / 2) * k2.x, y: p.y + (h / 2) * k2.y });
  const k4 = field(t + h, { x: p.x + h * k3.x, y: p.y + h * k3.y });
  return {
    x: p.x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: p.y + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
  };
}

function integrate(solver: Solver, n: number): Point[] {
  const pts: Point[] = [{ ...START }];
  let p = { ...START };
  const h = 1 / n;
  for (let i = 0; i < n; i++) {
    const t = i * h;
    if (solver === 'euler') {
      const k = field(t, p);
      p = { x: p.x + h * k.x, y: p.y + h * k.y };
    } else if (solver === 'midpoint') {
      const k1 = field(t, p);
      const mid = { x: p.x + (h / 2) * k1.x, y: p.y + (h / 2) * k1.y };
      const k2 = field(t + h / 2, mid);
      p = { x: p.x + h * k2.x, y: p.y + h * k2.y };
    } else {
      p = rk4Step(t, p, h);
    }
    pts.push(p);
  }
  return pts;
}

const REFERENCE = integrate('rk4', REF_STEPS);
const resultCache = new Map<string, Point[]>();
function result(solver: Solver, n: number): Point[] {
  const key = `${solver}-${n}`;
  if (!resultCache.has(key)) resultCache.set(key, integrate(solver, n));
  return resultCache.get(key)!;
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function refAt(t: number): Point {
  const i = Math.max(0, Math.min(REF_STEPS, Math.round(t * REF_STEPS)));
  return REFERENCE[i];
}

function nfeOf(solver: Solver, n: number) {
  return n * (solver === 'euler' ? 1 : solver === 'midpoint' ? 2 : 4);
}

function finalError(solver: Solver, n: number) {
  return Math.max(1e-12, dist(result(solver, n)[n], REFERENCE[REF_STEPS]));
}

function plotPoint(p: Point, box: { x: number; y: number; w: number; h: number }, xr: [number, number], yr: [number, number]) {
  return {
    x: box.x + ((p.x - xr[0]) / (xr[1] - xr[0])) * box.w,
    y: box.y + box.h - ((p.y - yr[0]) / (yr[1] - yr[0])) * box.h,
  };
}

export const Ch6Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [solver, setSolver] = useState<Solver>('midpoint');
  const [n, setN] = useState(8);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '这是教学玩具向量场；从同一起点出发，按下一步执行真实数值积分。', cls: '' });
  const stateRef = useRef({ solver: 'midpoint' as Solver, n: 8, step: 0 });

  const advance = (next: number) => {
    const st = Math.max(0, Math.min(stateRef.current.n, next));
    stateRef.current.step = st;
    setStep(st);
    const t = st / stateRef.current.n;
    const p = result(stateRef.current.solver, stateRef.current.n)[st];
    const err = dist(p, refAt(t));
    if (st === 0) setFeedback({ text: '起点是固定的；参考解由 4096 步 RK4 计算。', cls: '' });
    else if (st < stateRef.current.n) setFeedback({ text: `t=${t.toFixed(2)}，当前位置 (${p.x.toFixed(3)}, ${p.y.toFixed(3)})，真实误差 ${err.toExponential(2)}。`, cls: '' });
    else setFeedback({ text: `到达 t=1；当前求解器误差 ${err.toExponential(2)}，NFE=${nfeOf(stateRef.current.solver, stateRef.current.n)}。`, cls: err < 1e-3 ? 'good' : 'bad' });
  };

  const chooseSolver = (sv: Solver) => {
    setSolver(sv);
    stateRef.current.solver = sv;
    stateRef.current.step = 0;
    setStep(0);
    setFeedback({ text: '求解器已切换；轨迹、NFE 与误差会按新的单步公式重新计算。', cls: '' });
  };

  const chooseN = (nextN: number) => {
    setN(nextN);
    stateRef.current.n = nextN;
    stateRef.current.step = 0;
    setStep(0);
    setFeedback({ text: `步数改为 ${nextN}；轨迹已重新积分，NFE 按实际函数评估次数统计。`, cls: '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx) => {
      const s = stateRef.current;
      drawField(ctx, W, H);
      const pts = result(s.solver, s.n);
      const all = [...pts, ...REFERENCE];
      const xs = all.map((p) => p.x);
      const ys = all.map((p) => p.y);
      const xr: [number, number] = [Math.min(...xs) - 0.15, Math.max(...xs) + 0.15];
      const yr: [number, number] = [Math.min(...ys) - 0.15, Math.max(...ys) + 0.15];
      const box = { x: 52, y: 30, w: 500, h: 220 };
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
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
      const refPts = REFERENCE.filter((_, i) => i % 8 === 0).map((p) => plotPoint(p, box, xr, yr));
      drawTrajectory(ctx, refPts, C.line, true, 1.5);
      const solverPts = pts.map((p) => plotPoint(p, box, xr, yr));
      drawTrajectory(ctx, solverPts, C.blue, false, 3.5);
      const cur = solverPts[s.step];
      const prev = solverPts[Math.max(0, s.step - 1)];
      drawPlane(ctx, cur.x, cur.y, Math.atan2(cur.y - prev.y, cur.x - prev.x), 0.9, C.blue);
      const end = plotPoint(REFERENCE[REF_STEPS], box, xr, yr);
      drawTarget(ctx, end.x, end.y, 18, s.step === s.n);
      drawLabel(ctx, '轨迹', box.x + 8, box.y + 22, C.muted, 17);

      // Error-vs-NFE chart
      const chart = { x: 630, y: 30, w: 400, h: 220 };
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(chart.x, chart.y, chart.w, chart.h);
      ctx.fill();
      ctx.stroke();
      const allErrors = ERROR_STEPS.flatMap((en) =>
        (['euler', 'midpoint', 'rk4'] as Solver[]).map((sv) => finalError(sv, en))
      );
      const logMin = Math.log10(Math.min(...allErrors));
      const logMax = Math.log10(Math.max(...allErrors));
      const nfeMin = Math.log10(2);
      const nfeMax = Math.log10(256);
      const ex = (nfe: number) => chart.x + 30 + ((Math.log10(nfe) - nfeMin) / (nfeMax - nfeMin)) * (chart.w - 50);
      const ey = (err: number) => chart.y + chart.h - 24 - ((Math.log10(err) - logMin) / (logMax - logMin || 1)) * (chart.h - 50);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chart.x + 30, chart.y + chart.h - 24);
      ctx.lineTo(chart.x + chart.w - 12, chart.y + chart.h - 24);
      ctx.moveTo(chart.x + 30, chart.y + 18);
      ctx.lineTo(chart.x + 30, chart.y + chart.h - 24);
      ctx.stroke();
      const solveColors: Record<Solver, string> = { euler: C.orange, midpoint: C.blue, rk4: C.green };
      (['euler', 'midpoint', 'rk4'] as Solver[]).forEach((sv) => {
        ctx.strokeStyle = sv === s.solver ? solveColors[sv] : `${solveColors[sv]}88`;
        ctx.lineWidth = sv === s.solver ? 3 : 1.8;
        ctx.beginPath();
        ERROR_STEPS.forEach((en, i) => {
          const xx = ex(nfeOf(sv, en));
          const yy = ey(finalError(sv, en));
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        });
        ctx.stroke();
        const curNfe = nfeOf(sv, s.n);
        const curErr = finalError(sv, s.n);
        ctx.fillStyle = solveColors[sv];
        ctx.beginPath();
        ctx.arc(ex(curNfe), ey(curErr), sv === s.solver ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      drawLabel(ctx, '误差', chart.x + 8, chart.y + 22, C.muted, 17);
      ctx.restore();
    },
    W,
    H
  );

  const pts = result(solver, n);
  const p = pts[step];
  const err = dist(p, refAt(step / n));
  const nfe = step * (solver === 'euler' ? 1 : solver === 'midpoint' ? 2 : 4);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="Euler、Midpoint、RK4 真实数值积分与误差对比" />
      <div className="ctrl">
        <button type="button" onClick={() => advance(step - 1)} disabled={step === 0}>上一步</button>
        <button type="button" onClick={() => advance(step + 1)} disabled={step === n}>下一步</button>
        <button type="button" onClick={() => advance(0)}>重置</button>
        {(['euler', 'midpoint', 'rk4'] as const).map((sv) => (
          <button key={sv} type="button" className={`chip ${solver === sv ? 'selected' : ''}`} aria-pressed={solver === sv} onClick={() => chooseSolver(sv)}>
            {sv === 'euler' ? 'Euler' : sv === 'midpoint' ? 'Midpoint' : 'RK4'}
          </button>
        ))}
        {STEP_OPTIONS.map((sn) => (
          <button key={sn} type="button" className={`chip ${n === sn ? 'selected' : ''}`} aria-pressed={n === sn} onClick={() => chooseN(sn)}>
            {sn} 步
          </button>
        ))}
      </div>
      <div className="fm-legend">
        <span><i style={{ background: C.orange }} />Euler</span>
        <span><i style={{ background: C.blue }} />Midpoint</span>
        <span><i style={{ background: C.green }} />RK4</span>
        <span>当前求解器加粗，当前 NFE 点放大</span>
      </div>
      <div className="fm-readout">
        <div><span className="k">t</span> {(step / n).toFixed(3)}</div>
        <div><span className="k">位置</span> ({p.x.toFixed(3)}, {p.y.toFixed(3)})</div>
        <div><span className="k">NFE</span> {nfe}</div>
        <div><span className="k">误差</span> {err.toExponential(2)}</div>
        <div><span className="k">求解器</span> {solver}</div>
        <div><span className="k">步数</span> {n}</div>
      </div>
      <p className="fm-note">
        本模块使用教学玩具向量场 v(t,x)，从固定起点真实执行 Euler / Midpoint / RK4 单步更新；参考解由 {REF_STEPS} 步 RK4 计算。左图为归一化二维轨迹（浅灰虚线=参考解，蓝色=当前求解器）；右图横轴为 <strong>log10(NFE)</strong>，纵轴为 <strong>log10(真实误差)</strong>。NFE 按实际函数评估次数统计：Euler 每步 1 次、Midpoint 2 次、RK4 4 次。该图不是论文训练模型的结果；论文 Figure 6 是 ImageNet 64×64 的真实采样路径。
      </p>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Flight;
