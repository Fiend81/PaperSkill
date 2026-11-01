import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  drawField,
  drawFlightLog,
  drawGaussian,
  drawPlane,
  drawTarget,
  drawTrajectory,
  drawWindVane,
  useFlowCanvas,
} from './flowKit';

const AW = 560;
const AH = 140;

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

function phase(time: number, duration = 3400) {
  const x = (time % duration) / duration;
  return x < 0.5 ? x * 2 : (1 - x) * 2;
}

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 34, y);
  ctx.lineTo(x - 4, y);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 4);
  ctx.lineTo(x + 5, y);
  ctx.lineTo(x - 4, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const AnalogyFlight: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapter = Number(chapterId.replace('chap-', '')) || 1;

  useFlowCanvas(
    canvasRef,
    (ctx, time) => {
      drawField(ctx, AW, AH);
      const t = phase(time, 3400);
      const target = { x: 505, y: 80 };
      drawTarget(ctx, target.x, target.y, 16, false);

      if (chapter === 1) {
        drawWindVane(ctx, 58, 24, 0.65);
        const p0 = { x: 40, y: 100 };
        const p1 = { x: 160, y: 18 };
        const p2 = { x: 330, y: 142 };
        const p3 = { x: 425, y: 48 };
        const pts: Array<{ x: number; y: number }> = [];
        for (let i = 0; i <= 30; i++) pts.push(cubic(p0, p1, p2, p3, i / 30));
        drawTrajectory(ctx, pts, C.red, true, 2.5);
        const pos = cubic(p0, p1, p2, p3, t);
        const ahead = cubic(p0, p1, p2, p3, Math.min(1, t + 0.03));
        drawPlane(ctx, pos.x, pos.y, Math.atan2(ahead.y - pos.y, ahead.x - pos.x), 0.65, C.red);
      } else if (chapter === 2) {
        const y = 82;
        drawGaussian(ctx, 70, y, 22 - 14 * t, 30, C.blue);
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(70, y);
        ctx.lineTo(70 + 410 * t, y);
        ctx.stroke();
        drawPencil(ctx, 70 + 410 * t, y);
        drawTarget(ctx, 500, y, 13, t > 0.92);
      } else if (chapter === 3) {
        const lanes = [52, 80, 108];
        lanes.forEach((y, i) => {
          const pts: Array<{ x: number; y: number }> = [];
          for (let k = 0; k <= 24; k++) {
            const u = k / 24;
            pts.push({ x: 44 + 420 * u, y: y + Math.sin(u * Math.PI) * (i - 1) * 8 });
          }
          drawTrajectory(ctx, pts, i === 1 ? C.blue : C.line, i !== 1, i === 1 ? 3 : 2);
        });
        if (t > 0.45) {
          const alpha = Math.min(1, (t - 0.45) / 0.35);
          ctx.save();
          ctx.globalAlpha = alpha;
          const avg: Array<{ x: number; y: number }> = [];
          for (let k = 0; k <= 24; k++) {
            const u = k / 24;
            avg.push({ x: 44 + 420 * u, y: 80 + Math.sin(u * Math.PI) * 2 });
          }
          drawTrajectory(ctx, avg, C.green, false, 4);
          ctx.restore();
        }
        const x = 44 + 420 * t;
        const y = 80;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 7, y);
        ctx.lineTo(x + 18, y - 6);
        ctx.stroke();
      } else if (chapter === 4) {
        drawWindVane(ctx, 58, 24, 0.35);
        const wide: Array<{ x: number; y: number }> = [];
        const narrow: Array<{ x: number; y: number }> = [];
        for (let k = 0; k <= 30; k++) {
          const u = k / 30;
          wide.push({ x: 80 + 390 * u, y: 96 + Math.sin(u * Math.PI) * 28 });
          narrow.push({ x: 80 + 390 * u, y: 96 + Math.sin(u * Math.PI) * 7 });
        }
        drawTrajectory(ctx, wide, C.red, true, 2);
        drawTrajectory(ctx, narrow, C.blue, false, 3);
        const pos = narrow[Math.floor(t * 30)] || narrow[0];
        drawPlane(ctx, pos.x, pos.y, Math.atan2(-7 * Math.PI * Math.cos(t * Math.PI) / 390, 1), 0.65, C.blue);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x + 4, pos.y - 12);
        ctx.lineTo(pos.x + 22, pos.y - 22);
        ctx.stroke();
      } else if (chapter === 5) {
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(280, 16);
        ctx.lineTo(280, 124);
        ctx.stroke();
        const left = cubic(
          { x: 40, y: 100 },
          { x: 105, y: 20 },
          { x: 210, y: 130 },
          { x: 250, y: 76 },
          t
        );
        const right = { x: 310 + 200 * t, y: 80 + (1 - t) * 18 };
        const leftPts: Array<{ x: number; y: number }> = [];
        const rightPts: Array<{ x: number; y: number }> = [];
        for (let k = 0; k <= 24; k++) {
          leftPts.push(cubic({ x: 40, y: 100 }, { x: 105, y: 20 }, { x: 210, y: 130 }, { x: 250, y: 76 }, k / 24));
          rightPts.push({ x: 310 + 200 * (k / 24), y: 80 + (1 - k / 24) * 18 });
        }
        drawTrajectory(ctx, leftPts, C.red, true, 2.5);
        drawTrajectory(ctx, rightPts, C.green, false, 3);
        drawPlane(ctx, left.x, left.y, 0.2, 0.55, C.red);
        drawPlane(ctx, right.x, right.y, 0, 0.55, C.green);
        drawTarget(ctx, 255, 76, 11, false);
        drawTarget(ctx, 525, 80, 11, true);
      } else if (chapter === 6) {
        drawFlightLog(ctx, 50, 32, 450, 90);
        const pts: Array<{ x: number; y: number }> = [];
        for (let k = 0; k <= 30; k++) {
          const u = k / 30;
          pts.push({ x: 55 + 430 * u, y: 100 - Math.sin(u * Math.PI) * 30 });
        }
        drawTrajectory(ctx, pts, C.line, true, 2);
        const pos = pts[Math.floor(t * 30)] || pts[0];
        drawPlane(ctx, pos.x, pos.y, Math.atan2(-30 * Math.PI * Math.cos(t * Math.PI) / 430, 1), 0.65, C.blue);
        drawTarget(ctx, 500, 100, 13, t > 0.95);
      } else if (chapter === 7) {
        const marks = [360, 400, 440];
        marks.forEach((x, i) => {
          ctx.fillStyle = i === 2 ? C.green : C.muted;
          ctx.beginPath();
          ctx.arc(x, 104, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        const p0 = { x: 60, y: 110 };
        const p1 = { x: 190, y: 30 };
        const p2 = { x: 360, y: 120 };
        const p3 = { x: 470, y: 92 };
        const pts: Array<{ x: number; y: number }> = [];
        for (let k = 0; k <= 28; k++) pts.push(cubic(p0, p1, p2, p3, k / 28));
        drawTrajectory(ctx, pts, C.blue, true, 2);
        const pos = cubic(p0, p1, p2, p3, t);
        drawPlane(ctx, pos.x, pos.y, Math.atan2(-20, 200), 0.65, C.blue);
        drawTarget(ctx, 500, 90, 14, t > 0.9);
      } else if (chapter === 8) {
        drawFlightLog(ctx, 50, 24, 440, 96);
        [100, 270, 440].forEach((x, i) => {
          ctx.fillStyle = i === 0 ? C.purple : i === 2 ? C.green : C.blue;
          ctx.beginPath();
          ctx.arc(x, 72, 13, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(113, 72);
        ctx.lineTo(257, 72);
        ctx.moveTo(283, 72);
        ctx.lineTo(427, 72);
        ctx.stroke();
        const x = 100 + 340 * t;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(x, 72, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 6, 72);
        ctx.lineTo(x + 18, 64);
        ctx.stroke();
      } else if (chapter === 9) {
        drawWindVane(ctx, 58, 24, 0.4);
        const pts: Array<{ x: number; y: number }> = [];
        for (let k = 0; k <= 30; k++) {
          const u = k / 30;
          pts.push({ x: 80 + 390 * u, y: 96 - Math.sin(u * Math.PI) * 10 });
        }
        drawTrajectory(ctx, pts, C.blue, false, 3);
        const pos = pts[Math.floor(t * 30)] || pts[0];
        drawPlane(ctx, pos.x, pos.y, 0, 0.65, C.blue);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x - 2, pos.y - 10);
        ctx.lineTo(pos.x + 10, pos.y - 18);
        ctx.stroke();
        drawTarget(ctx, 500, 96, 13, true);
      } else {
        const lanes = [48, 80, 112];
        const colors = [C.muted, C.blue, C.green];
        const speeds = [0.72, 0.84, 1];
        lanes.forEach((y, i) => {
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(40, y);
          ctx.lineTo(500, y);
          ctx.stroke();
          const x = 40 + 420 * Math.min(1, t * speeds[i]);
          drawPlane(ctx, x, y, 0, 0.55, colors[i]);
        });
        drawTarget(ctx, 505, 80, 16, true);
      }
    },
    AW,
    AH
  );

  return <canvas ref={canvasRef} width={AW} height={AH} aria-hidden="true" />;
};

export default AnalogyFlight;
