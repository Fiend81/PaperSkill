import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C } from './flowKit';

const DATA = [
  { key: 'sm', name: 'Score Matching', short: 'SM', color: C.orange, nll: 3.56, fid: 5.68, nfe: 178 },
  { key: 'fmd', name: 'FM-Diffusion', short: 'FMD', color: C.blue, nll: 3.54, fid: 6.37, nfe: 193 },
  { key: 'fmot', name: 'FM-OT', short: 'FMOT', color: C.green, nll: 3.53, fid: 5.02, nfe: 122 },
];

type Metric = 'all' | 'nll' | 'fid' | 'nfe';
const GROUPS: Array<{ key: Exclude<Metric, 'all'>; label: string; unit: string; max: number; field: 'nll' | 'fid' | 'nfe' }> = [
  { key: 'nll', label: 'NLL / BPD', unit: '越低越好', max: 4, field: 'nll' },
  { key: 'fid', label: 'FID', unit: '越低越好', max: 7, field: 'fid' },
  { key: 'nfe', label: 'NFE', unit: '越低越好', max: 220, field: 'nfe' },
];

function axisLabel(value: number, max: number) {
  if (max >= 100) return value.toFixed(0);
  if (max >= 10) return value.toFixed(1);
  return value.toFixed(1);
}

export const Ch9Flight: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('all');
  const selected = GROUPS.find((g) => g.key === metric);

  const feedback = (() => {
    if (metric === 'nll') return 'NLL/BPD 越低越好：SM 3.56，FMD 3.54，FM-OT 3.53；数值差异很小，柱高接近是正常的。';
    if (metric === 'fid') return 'FID 越低越好：SM 5.68，FMD 6.37，FM-OT 5.02；FM-Diffusion 的 FID 并非优于 SM，训练稳定性不能替代单项指标。';
    if (metric === 'nfe') return 'NFE 越低越好：SM 178，FMD 193，FM-OT 122；NFE 依赖 ODE 求解器、容差与采样设置，不能脱离协议比较。';
    return '三项指标各自使用独立坐标轴；柱长不跨组比较。点击上方指标可突出对应分组。';
  })();

  return (
    <div>
      <div className="ctrl">
        {(['all', 'nll', 'fid', 'nfe'] as Metric[]).map((m) => (
          <button key={m} type="button" className={`chip ${metric === m ? 'selected' : ''}`} aria-pressed={metric === m} onClick={() => setMetric(m)}>
            {m === 'all' ? '全部指标' : m === 'nll' ? 'NLL / BPD' : m === 'fid' ? 'FID' : 'NFE'}
          </button>
        ))}
      </div>

      <svg className="fm-groupchart" viewBox="0 0 1080 330" role="img" aria-label="Table 1 ImageNet 32x32 三项指标分组柱状图">
        <rect x="0" y="0" width="1080" height="330" fill="#ffffff" />
        <g fontFamily="'Microsoft YaHei', 'Segoe UI', sans-serif">
          {/* Legend */}
          {DATA.map((d, i) => (
            <g key={d.key}>
              <rect x={60 + i * 180} y={12} width={13} height={13} fill={d.color} rx={2} />
              <text x={79 + i * 180} y={23} fontSize={13} fill={C.text}>{d.name}</text>
            </g>
          ))}
          <text x={1020} y={23} textAnchor="end" fontSize={12} fill={C.muted}>Table 1 · ImageNet 32×32</text>

          {GROUPS.map((group, gi) => {
            const x0 = 60 + gi * 340;
            const plotBottom = 270;
            const plotTop = 78;
            const plotH = plotBottom - plotTop;
            const groupW = 280;
            const dim = metric !== 'all' && metric !== group.key;
            const values = DATA.map((d) => d[group.field]);
            return (
              <g key={group.key} opacity={dim ? 0.28 : 1}>
                {metric === group.key ? (
                  <rect x={x0 - 22} y={34} width={groupW + 44} height={268} rx={12} fill="rgba(39,68,110,0.04)" stroke={C.blue} strokeWidth={1.5} />
                ) : null}
                <text x={x0} y={46} fontSize={17} fontWeight={700} fill={C.text}>{group.label}</text>
                <text x={x0 + groupW} y={46} textAnchor="end" fontSize={12} fill={C.muted}>{group.unit}</text>
                {/* y axis + ticks */}
                <line x1={x0} y1={plotTop} x2={x0} y2={plotBottom} stroke={C.muted} strokeWidth={1.5} />
                {[0, 0.5, 1].map((f) => {
                  const y = plotBottom - f * plotH;
                  return (
                    <g key={f}>
                      <line x1={x0 - 5} y1={y} x2={x0 + groupW} y2={y} stroke="rgba(215,222,234,0.9)" strokeWidth={1} />
                      <text x={x0 - 8} y={y + 4} textAnchor="end" fontSize={11} fill={C.muted}>{axisLabel(group.max * f, group.max)}</text>
                    </g>
                  );
                })}
                {/* bars */}
                {DATA.map((d, i) => {
                  const value = d[group.field];
                  const barH = (value / group.max) * plotH;
                  const bx = x0 + 48 + i * 76;
                  const by = plotBottom - barH;
                  return (
                    <g key={d.key}>
                      <rect x={bx} y={by} width={48} height={barH} fill={d.color} rx={4} />
                      <text x={bx + 24} y={by - 7} textAnchor="middle" fontSize={13} fontWeight={700} fill={C.text}>
                        {group.field === 'nfe' ? value.toFixed(0) : value.toFixed(2)}
                      </text>
                      <text x={bx + 24} y={plotBottom + 17} textAnchor="middle" fontSize={11} fill={C.muted}>{d.short}</text>
                    </g>
                  );
                })}
                <line x1={x0} y1={plotBottom} x2={x0 + groupW} y2={plotBottom} stroke={C.muted} strokeWidth={1.5} />
              </g>
            );
          })}
        </g>
      </svg>

      <div className="fm-readout">
        {selected
          ? DATA.map((d) => (
              <div key={d.key}><span className="k">{d.short}</span> {selected.label}: {selected.field === 'nfe' ? d.nfe : d[selected.field].toFixed(2)}</div>
            ))
          : DATA.map((d) => (
              <div key={d.key}><span className="k">{d.short}</span> NLL {d.nll.toFixed(2)} · FID {d.fid.toFixed(2)} · NFE {d.nfe}</div>
            ))}
      </div>

      <p className="fm-note">
        上方为论文 Figure 4（2D checkerboard 的轨迹与 NFE）和 Figure 5（ImageNet 64×64 训练 FID 曲线）的真实实验图；Appendix Figure 9/10 也给出 ScoreFlow/DDPM 的 2D 轨迹与训练中的 NFE，本页为控制篇幅未重复嵌入。下方柱状图只使用 Table 1 的 ImageNet 32×32 数值。三项指标各自归一化到自己的 0–max 坐标轴，<strong>柱长不能跨指标比较</strong>；FID 衡量生成分布距离，NLL/BPD 衡量似然，NFE 是函数评估次数。训练稳定性、训练收敛、FID 和 NFE 不是同一个指标；飞机抖动不再作为稳定性证据。
      </p>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default Ch9Flight;
