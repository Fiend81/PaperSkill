import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const W = 1080;
export const H = 280;

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

export function drawField(ctx: CanvasRenderingContext2D, w = W, h = H) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const horizon = h * 0.72;
  ctx.fillStyle = 'rgba(184,201,167,0.35)';
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(w, horizon);
  ctx.stroke();
}

export function drawFlightLog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(215,222,234,0.9)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const gx = x + (w / 8) * i;
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let j = 0; j <= 4; j++) {
    const gy = y + (h / 4) * j;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  active = false
) {
  const color = active ? C.green : C.muted;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  [1, 0.66, 0.33].forEach((k) => {
    ctx.beginPath();
    ctx.arc(x, y, r * k, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.fillStyle = active ? C.green : C.muted;
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPlane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  scale = 1,
  color = C.blue
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(20 * scale, 0);
  ctx.lineTo(-13 * scale, -11 * scale);
  ctx.lineTo(-6 * scale, 0);
  ctx.lineTo(-13 * scale, 11 * scale);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6 * scale, 0);
  ctx.lineTo(20 * scale, 0);
  ctx.strokeStyle = 'rgba(33,50,74,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  color: string,
  dashed = false,
  width = 3
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

export function drawLaunchRamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, 20);
  ctx.lineTo(22, -20);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-26, 20);
  ctx.lineTo(-26, 38);
  ctx.stroke();
  ctx.restore();
}

export function drawWindVane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  strength = 0.5
) {
  ctx.save();
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 34);
  ctx.stroke();
  const len = 18 + 26 * Math.max(0, Math.min(1, strength));
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - len / 2, y);
  ctx.lineTo(x + len / 2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + len / 2, y);
  ctx.lineTo(x + len / 2 - 7, y - 5);
  ctx.lineTo(x + len / 2 - 7, y + 5);
  ctx.closePath();
  ctx.fillStyle = C.support;
  ctx.fill();
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  size = 18
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ label: string; color: string }>,
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
  items.slice(0, 3).forEach((item, i) => {
    const yy = y + i * 22;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, yy - 10, 12, 12);
    ctx.fillStyle = C.muted;
    ctx.fillText(item.label, x + 18, yy);
  });
  ctx.restore();
}

export function drawGaussian(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
  color = C.blue
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  [1, 0.68, 0.36].forEach((k, i) => {
    ctx.globalAlpha = 0.16 + i * 0.08;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(3, sx * k), Math.max(3, sy * k), 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  width = 3
) {
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  const hx = x + dx;
  const hy = y + dy;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx - ux * 10 - uy * 5, hy - uy * 10 + ux * 5);
  ctx.lineTo(hx - ux * 10 + uy * 5, hy - uy * 10 - ux * 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  items: Array<{ value: number; max: number; color: string }>
) {
  const n = Math.max(1, items.length);
  const gap = 14;
  const bh = (h - gap * (n - 1)) / n;
  items.forEach((item, i) => {
    const by = y + i * (bh + gap);
    ctx.fillStyle = 'rgba(215,222,234,0.55)';
    ctx.fillRect(x, by, w, bh);
    const bw = Math.max(0, Math.min(1, item.value / item.max)) * w;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, by, bw, bh);
  });
}

/** Shared rAF canvas loop. `draw` reads the latest state from a ref. */
export function useFlowCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  width = W,
  height = H
) {
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (time: number) => {
      drawRef.current(ctx, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [canvasRef, width, height]);
}
