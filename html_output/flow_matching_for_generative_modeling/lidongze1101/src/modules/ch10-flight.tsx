import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawField,
  drawPlane,
  drawTarget,
  drawTrajectory,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;

type Dataset = 'cifar' | 'in32' | 'in64';

const ROWS: Record<Dataset, { name: string; rows: Array<{ name: string; nll: number; fid: number; nfe: number; color: string }> }> = {
  cifar: {
    name: 'CIFAR-10',
    rows: [
      { name: 'DDPM', nll: 3.12, fid: 7.48, nfe: 274, color: C.muted },
      { name: 'FM-Diffusion', nll: 3.1, fid: 8.06, nfe: 183, color: C.blue },
      { name: 'FM-OT', nll: 2.99, fid: 6.35, nfe: 142, color: C.green },
    ],
  },
  in32: {
    name: 'ImageNet 32×32',
    rows: [
      { name: 'DDPM', nll: 3.54, fid: 6.99, nfe: 262, color: C.muted },
      { name: 'FM-Diffusion', nll: 3.54, fid: 6.37, nfe: 193, color: C.blue },
      { name: 'FM-OT', nll: 3.53, fid: 5.02, nfe: 122, color: C.green },
    ],
  },
  in64: {
    name: 'ImageNet 64×64',
    rows: [
      { name: 'DDPM', nll: 3.32, fid: 17.36, nfe: 264, color: C.muted },
      { name: 'FM-Diffusion', nll: 3.33, fid: 16.88, nfe: 187, color: C.blue },
      { name: 'FM-OT', nll: 3.31, fid: 14.45, nfe: 138, color: C.green },
    ],
  },
};

function finalX(fid: number, maxFid: number) {
  return 920 - (fid / maxFid) * 240;
}

export const Ch10Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataset, setDataset] = useState<Dataset>('in32');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '选择数据集，按下开始比赛；距离按 FID 映射，只是论文数据的可视化。', cls: '' });
  const stateRef = useRef({ dataset: 'in32' as Dataset, running: false, progress: 0, last: 0 });

  const choose = (d: Dataset) => {
    setDataset(d);
    stateRef.current.dataset = d;
    stateRef.current.running = false;
    stateRef.current.progress = 0;
    setRunning(false);
    setFeedback({ text: '数据集已切换；表格与赛道都使用 Table 1 的对应数值，请重新开始比较。', cls: '' });
  };

  const start = () => {
    stateRef.current.running = true;
    stateRef.current.progress = 0;
    stateRef.current.last = 0;
    setRunning(true);
    setFeedback({ text: '三条赛道使用同一套验证指标；距离按 FID 反向映射，不代表真实生成速度或采样仿真。', cls: '' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx, time) => {
      const s = stateRef.current;
      if (s.running) {
        if (!s.last) s.last = time;
        s.progress = Math.min(1, s.progress + (time - s.last) / 2400);
        s.last = time;
        if (s.progress >= 1) {
          s.running = false;
          setRunning(false);
          setFeedback({ text: '在该数据集上，FM-OT 的 FID 最低；表中同时列出 NLL 与 NFE。该动画只映射论文数值。', cls: 'good' });
        }
      }
      drawField(ctx, W, H);
      const data = ROWS[s.dataset];
      const maxFid = Math.max(...data.rows.map((r) => r.fid));
      const lanes = [70, 140, 210];
      data.rows.forEach((row, i) => {
        const y = lanes[i];
        drawTrajectory(ctx, [{ x: 50, y }, { x: 940, y }], C.line, true, 1.5);
        const end = finalX(row.fid, maxFid);
        const x = 50 + (end - 50) * s.progress;
        drawPlane(ctx, x, y, 0, 0.85, row.color);
      });
      drawTarget(ctx, 955, 140, 32, !s.running && s.progress >= 1);
    },
    W,
    H
  );

  const data = ROWS[dataset];

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} aria-label="结果着陆比赛：论文 FID 数据的可视化映射" />
      <div className="ctrl">
        {(Object.keys(ROWS) as Dataset[]).map((d) => (
          <button key={d} type="button" className={`chip ${dataset === d ? 'selected' : ''}`} aria-pressed={dataset === d} onClick={() => choose(d)}>
            {ROWS[d].name}
          </button>
        ))}
        <button type="button" onClick={start} disabled={running}>
          {running ? '比赛中…' : '开始比赛'}
        </button>
      </div>
      <table className="paper">
        <thead>
          <tr><th>方法（Table 1）</th><th>NLL (BPD) ↓</th><th>FID ↓</th><th>NFE ↓</th></tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.name}><td>{row.name}</td><td>{row.nll.toFixed(2)}</td><td>{row.fid.toFixed(2)}</td><td>{row.nfe}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="fm-note">
        赛跑动画只是把 FID 反向映射为“距离目标”的可视化，<strong>不是</strong>真实生成速度、采样仿真或模型推理。FID 衡量生成分布与真实分布在 Inception 特征空间中的距离；NLL/BPD 衡量似然（每维编码长度）；NFE 是 ODE 求解器的函数评估次数，反映采样计算量。三者都是越低越好，但 NFE 依赖求解器、容差与采样设置，不能脱离协议单独比较。表中数值来自论文 Table 1（无标签 CIFAR-10 / ImageNet 32×32 / 64×64）。
      </p>
      <table className="paper">
        <thead>
          <tr><th>ImageNet 128×128（Table 1 右）</th><th>NLL (BPD) ↓</th><th>FID ↓</th><th>NFE</th></tr>
        </thead>
        <tbody>
          <tr><td>FM-OT</td><td>2.90</td><td>20.9</td><td>未报告</td></tr>
        </tbody>
      </table>
      <p className="fm-note">
        ImageNet 128×128 这一组只报告 NLL 与 FID，论文没有给出可与前三组直接并列的 NFE；IC-GAN 因使用自监督条件而未列入该表。因此不能把它与上方三组做同名次排名。
      </p>
      <table className="paper">
        <thead>
          <tr><th>64×64 → 256×256 超分（Table 2）</th><th>FID ↓</th><th>IS ↑</th><th>PSNR ↑</th><th>SSIM ↑</th></tr>
        </thead>
        <tbody>
          <tr><td>SR3</td><td>5.2</td><td>180.1</td><td>26.4</td><td>0.762</td></tr>
          <tr><td>FM-OT</td><td>3.4</td><td>200.8</td><td>24.7</td><td>0.747</td></tr>
        </tbody>
      </table>
      <p className="fm-note">
        超分结果不是“所有指标全面胜出”：FM-OT 的感知指标 FID/IS 更好，但失真指标 PSNR/SSIM 低于 SR3。引用位置：论文 Table 2、Section 6.3。
      </p>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Flight;
