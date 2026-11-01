import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawField,
  drawPlane,
  drawTarget,
  drawTrajectory,
  useFlowCanvas,
} from './flowKit';

const HERO_W = 560;
const HERO_H = 140;

function cubic(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

export const HeroFlight: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const old = moduleId === 'old';

  useFlowCanvas(
    canvasRef,
    (ctx, time) => {
      drawField(ctx, HERO_W, HERO_H);
      const target = { x: 500, y: 88 };
      drawTarget(ctx, target.x, target.y, 20, !old);
      const p0 = { x: 42, y: 100 };
      const p1 = old ? { x: 190, y: 12 } : { x: 190, y: 72 };
      const p2 = old ? { x: 360, y: 150 } : { x: 360, y: 96 };
      const p3 = old ? { x: 420, y: 52 } : { x: 498, y: 88 };
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= 40; i++) pts.push(cubic(p0, p1, p2, p3, i / 40));
      drawTrajectory(ctx, pts, old ? C.red : C.blue, false, old ? 2.5 : 3.5);
      const step = old ? 0.08 : 0.25;
      for (let t = 0; t <= 1; t += step) {
        const p = cubic(p0, p1, p2, p3, t);
        ctx.fillStyle = old ? C.orange : C.green;
        ctx.beginPath();
        ctx.arc(p.x, p.y, old ? 2.2 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      const loop = (time % 3200) / 3200;
      const t = loop < 0.5 ? loop * 2 : (1 - loop) * 2;
      const pos = cubic(p0, p1, p2, p3, t);
      const ahead = cubic(p0, p1, p2, p3, Math.min(1, t + 0.02));
      drawPlane(ctx, pos.x, pos.y, Math.atan2(ahead.y - pos.y, ahead.x - pos.x), 0.7, old ? C.red : C.blue);
    },
    HERO_W,
    HERO_H
  );

  return <canvas ref={canvasRef} width={HERO_W} height={HERO_H} aria-label={old ? '传统扩散路径示意' : '流匹配直线路径示意'} />;
};

export default HeroFlight;
