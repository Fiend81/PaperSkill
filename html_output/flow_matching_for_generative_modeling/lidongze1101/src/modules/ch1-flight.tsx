import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp } from '../lib/canvasKit';
import {
  C,
  drawField,
  drawFlightLog,
  drawPlane,
  drawTarget,
  drawTrajectory,
  drawWindVane,
  useFlowCanvas,
} from './flowKit';

const W = 1080;
const H = 280;
const START = { x: 120, y: 210 };
const TARGET = { x: 930, y: 195 };

function landingX(angle: number) {
  return clamp(TARGET.x + 100 + angle * 2.5, 70, 1020);
}

function pathPoint(angle: number, t: number) {
  const p0 = START;
  const p1 = { x: 300, y: 210 - angle * 2.2 };
  const p2 = { x: 650, y: 210 + angle * 1.3 };
  const p3 = { x: landingX(angle), y: 195 };
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

export const Ch1Flight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ angle: 0, progress: 0, flying: false, last: 0, landed: false });
  const [angle, setAngle] = useState(0);
  const [flying, setFlying] = useState(false);
  const [feedback, setFeedback] = useState({ text: '拖动发射方向，试着命中右侧的着陆环。', cls: '' });

  const updateAngle = (value: number) => {
    const v = clamp(value, -30, 30);
    stateRef.current.angle = v;
    stateRef.current.landed = false;
    setAngle(v);
    setFeedback({ text: '拖动发射方向，试着命中右侧的着陆环。', cls: '' });
  };

  const startFlight = () => {
    stateRef.current.progress = 0;
    stateRef.current.flying = true;
    stateRef.current.last = 0;
    stateRef.current.landed = false;
    setFlying(true);
    setFeedback({ text: '纸飞机起飞了，观察它是否被侧风带偏。', cls: '' });
  };

  const finishFlight = () => {
    const s = stateRef.current;
    s.flying = false;
    s.landed = true;
    setFlying(false);
    const x = landingX(s.angle);
    const error = Math.abs(x - TARGET.x);
    if (error > 180) setFeedback({ text: '航线由固定条件决定，纸飞机被侧风带偏了。', cls: 'bad' });
    else if (error > 60) setFeedback({ text: '接近了，但落点仍不稳定。', cls: '' });
    else setFeedback({ text: '这次落点接近，但路线仍由外部条件决定，不能按目标直接设计。', cls: 'good' });
  };

  useFlowCanvas(
    canvasRef,
    (ctx, time) => {
      const s = stateRef.current;
      if (s.flying) {
        if (!s.last) s.last = time;
        s.progress = clamp(s.progress + (time - s.last) / 1800, 0, 1);
        s.last = time;
        if (s.progress >= 1) finishFlight();
      }
      drawField(ctx, W, H);
      drawFlightLog(ctx, 60, 70, 960, 160);
      drawTarget(ctx, TARGET.x, TARGET.y, 34, !s.flying && s.landed && Math.abs(landingX(s.angle) - TARGET.x) <= 60);
      drawWindVane(ctx, 110, 42, 0.8);
      const preview: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= 32; i++) preview.push(pathPoint(s.angle, i / 32));
      drawTrajectory(ctx, preview, s.landed ? C.line : C.blue, true, 2);
      if (s.flying || s.landed) {
        const p = pathPoint(s.angle, s.progress);
        const ahead = pathPoint(s.angle, Math.min(1, s.progress + 0.02));
        drawPlane(ctx, p.x, p.y, Math.atan2(ahead.y - p.y, ahead.x - p.x), 1, s.landed ? C.red : C.blue);
      } else {
        drawPlane(ctx, START.x, START.y, (-s.angle * Math.PI) / 180, 1, C.blue);
      }
      if (s.landed) {
        const x = landingX(s.angle);
        ctx.fillStyle = Math.abs(x - TARGET.x) <= 60 ? C.green : C.red;
        ctx.beginPath();
        ctx.arc(x, 195, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    W,
    H
  );

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.flying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const deg = clamp(((START.y - y) / 120) * 30, -30, 30);
    updateAngle(deg);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="受限航线纸飞机实验：拖动设置发射角度"
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePointer(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') updateAngle(angle + 2);
          if (e.key === 'ArrowDown') updateAngle(angle - 2);
        }}
      />
      <div className="ctrl">
        <label>
          发射角度 <span className="val">{angle.toFixed(0)}°</span>
        </label>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={Math.round(angle)}
          onChange={(e) => updateAngle(Number(e.target.value))}
        />
        <button type="button" onClick={startFlight} disabled={flying}>
          {flying ? '飞行中…' : '再投一次'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Flight;
