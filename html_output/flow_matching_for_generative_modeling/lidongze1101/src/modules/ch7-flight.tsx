import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawField,
  drawLabel,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;
const START_THETA = -2.5;
const TARGET_THETA = 2;

function loss(theta: number) {
  return 0.5 * (theta - TARGET_THETA) ** 2;
}

function grad(theta: number) {
  return theta - TARGET_THETA;
}

export const Ch7Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [eta, setEta] = useState(0.35);
  const [theta, setTheta] = useState(START_THETA);
  const [history, setHistory] = useState<number[]>([loss(START_THETA)]);
  const [iteration, setIteration] = useState(0);
  const [feedback, setFeedback] = useState({ text: '这是优化器教学的玩具模型：拖动学习率，然后执行真实的梯度下降更新。', cls: '' });
  const stateRef = useRef({ eta: 0.35, theta: START_THETA, history: [loss(START_THETA)], iteration: 0 });

  const reset = (nextEta = stateRef.current.eta) => {
    const h = [loss(START_THETA)];
    stateRef.current = { eta: nextEta, theta: START_THETA, history: h, iteration: 0 };
    setEta(nextEta);
    setTheta(START_THETA);
    setHistory(h);
    setIteration(0);
    setFeedback({ text: '已重置参数与损失历史，便于公平比较不同学习率。', cls: '' });
  };

  const setLearningRate = (value: number) => {
    const v = Math.max(0.01, Math.min(2.5, value));
    reset(v);
    if (v < 0.2) setFeedback({ text: '学习率较小：每步更新很小，收敛会明显变慢。', cls: '' });
    else if (v <= 1.0) setFeedback({ text: '学习率适中：参数会稳定收敛到 θ=2。', cls: 'good' });
    else if (v < 2.0) setFeedback({ text: '学习率偏大：参数会来回摆动，但仍可能收敛。', cls: '' });
    else setFeedback({ text: '学习率超过二次损失的稳定性边界 2：更新会被放大，可能发散。', cls: 'bad' });
  };

  const trainOne = () => {
    const s = stateRef.current;
    const g = grad(s.theta);
    const next = s.theta - s.eta * g;
    const nextLoss = loss(next);
    const nextHistory = [...s.history, nextLoss];
    const nextIteration = s.iteration + 1;
    stateRef.current = { ...s, theta: next, history: nextHistory, iteration: nextIteration };
    setTheta(next);
    setHistory(nextHistory);
    setIteration(nextIteration);
    if (!Number.isFinite(nextLoss) || nextLoss > 1e8) {
      setFeedback({ text: `第 ${nextIteration} 步后损失已发散（L=${nextLoss.toExponential(2)}）；学习率 ${s.eta.toFixed(2)} 超过稳定性范围。`, cls: 'bad' });
    } else if (Math.abs(g) < 1e-3) {
      setFeedback({ text: `已接近最优点 θ=2；当前损失 ${nextLoss.toExponential(2)}。`, cls: 'good' });
    } else {
      setFeedback({ text: `第 ${nextIteration} 步：θ=${next.toFixed(4)}，L=${nextLoss.toFixed(4)}，梯度=${grad(next).toFixed(4)}。`, cls: '' });
    }
  };

  const trainTen = () => {
    const s = stateRef.current;
    let th = s.theta;
    const h = [...s.history];
    let iter = s.iteration;
    for (let i = 0; i < 10; i++) {
      th = th - s.eta * grad(th);
      h.push(loss(th));
      iter += 1;
      if (!Number.isFinite(loss(th)) || loss(th) > 1e8) break;
    }
    stateRef.current = { ...s, theta: th, history: h, iteration: iter };
    setTheta(th);
    setHistory(h);
    setIteration(iter);
    setFeedback({ text: `连续执行 10 步：当前 θ=${th.toPrecision(5)}，L=${loss(th).toExponential(2)}。`, cls: loss(th) < 1e-2 ? 'good' : '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx) => {
      const s = stateRef.current;
      drawField(ctx, W, H);
      const left = { x: 50, y: 30, w: 520, h: 220 };
      const right = { x: 620, y: 30, w: 410, h: 220 };
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(left.x, left.y, left.w, left.h);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(215,222,234,0.8)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        const gx = left.x + (left.w / 8) * i;
        ctx.beginPath();
        ctx.moveTo(gx, left.y);
        ctx.lineTo(gx, left.y + left.h);
        ctx.stroke();
      }
      for (let j = 0; j <= 6; j++) {
        const gy = left.y + (left.h / 6) * j;
        ctx.beginPath();
        ctx.moveTo(left.x, gy);
        ctx.lineTo(left.x + left.w, gy);
        ctx.stroke();
      }
      const thetaMin = -6;
      const thetaMax = 6;
      const lossMax = 20;
      const px = (th: number) => left.x + 20 + ((Math.max(thetaMin, Math.min(thetaMax, th)) - thetaMin) / (thetaMax - thetaMin)) * (left.w - 40);
      const py = (l: number) => left.y + left.h - 18 - (Math.min(lossMax, Math.max(0, l)) / lossMax) * (left.h - 38);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left.x + 20, left.y + left.h - 18);
      ctx.lineTo(left.x + left.w - 12, left.y + left.h - 18);
      ctx.moveTo(left.x + 20, left.y + 16);
      ctx.lineTo(left.x + 20, left.y + left.h - 18);
      ctx.stroke();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const th = thetaMin + ((thetaMax - thetaMin) * i) / 160;
        const gx = px(th);
        const gy = py(loss(th));
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(px(TARGET_THETA), py(0), 5, 0, Math.PI * 2);
      ctx.fill();
      const th = s.theta;
      const current = loss(th);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(px(th), py(current), 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Tangent at current parameter.
      const slope = grad(th);
      const d = 0.8;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px(th - d), py(current - slope * d));
      ctx.lineTo(px(th + d), py(current + slope * d));
      ctx.stroke();
      drawLabel(ctx, '参数', left.x + 8, left.y + 20, C.muted, 17);

      // Loss history panel: log10(loss) vs iteration.
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(right.x, right.y, right.w, right.h);
      ctx.fill();
      ctx.stroke();
      const hist = s.history;
      const maxIter = Math.max(10, hist.length - 1);
      const losses = hist.map((v) => Math.max(1e-12, v));
      const logMin = Math.min(...losses.map((v) => Math.log10(v)), -3);
      const logMax = Math.max(...losses.map((v) => Math.log10(v)), 1);
      const hx = (i: number) => right.x + 34 + (i / maxIter) * (right.w - 48);
      const hy = (v: number) => right.y + right.h - 22 - ((Math.log10(Math.max(1e-12, v)) - logMin) / (logMax - logMin || 1)) * (right.h - 42);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(right.x + 34, right.y + right.h - 22);
      ctx.lineTo(right.x + right.w - 12, right.y + right.h - 22);
      ctx.moveTo(right.x + 34, right.y + 16);
      ctx.lineTo(right.x + 34, right.y + right.h - 22);
      ctx.stroke();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      hist.forEach((v, i) => {
        const xx = hx(i);
        const yy = hy(v);
        if (i === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      });
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(hx(hist.length - 1), hy(hist[hist.length - 1]), 5, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, '损失', right.x + 8, right.y + 20, C.muted, 17);
      ctx.restore();
    },
    W,
    H
  );

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="一维二次损失的梯度下降与学习率实验" />
      <div className="ctrl">
        <label>
          学习率 η <span className="val">{eta.toFixed(2)}</span>
        </label>
        <input type="range" min={1} max={250} value={Math.round(eta * 100)} onChange={(e) => setLearningRate(Number(e.target.value) / 100)} />
        <button type="button" onClick={trainOne}>训练一步</button>
        <button type="button" onClick={trainTen}>连续 10 步</button>
        <button type="button" onClick={() => reset()}>重置</button>
      </div>
      <div className="fm-readout">
        <div><span className="k">η</span> {eta.toFixed(2)}</div>
        <div><span className="k">θ</span> {theta.toFixed(4)}</div>
        <div><span className="k">L(θ)</span> {loss(theta).toExponential(3)}</div>
        <div><span className="k">梯度</span> {grad(theta).toFixed(4)}</div>
        <div><span className="k">迭代</span> {iteration}</div>
      </div>
      <p className="fm-note">
        玩具优化问题：L(θ)=0.5(θ−2)²，梯度下降 θ←θ−η(θ−2)。这里展示的是<strong>优化器与学习率</strong>的行为，不是论文的 CFM 网络训练曲线；真实 CFM 训练是最小化条件向量场的回归误差。论文的 “simulation-free” 指训练时不需要用数值 ODE 求解来获得监督目标，不代表生成采样不需要 ODE 积分。
      </p>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Flight;
