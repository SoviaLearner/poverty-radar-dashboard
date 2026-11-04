import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { Download } from 'lucide-react';

interface SpatialRankingProps {
  districts: District[];
  indicator: keyof District;
  indicatorLabel: string;
  unit: string;
}

export const SpatialRankingBar: React.FC<SpatialRankingProps> = ({
  districts,
  indicator,
  indicatorLabel,
  unit,
}) => {
  // Aggregate indicator average by Province
  const { provNames, provValues, nationalAvg } = useMemo(() => {
    const provMap: Record<string, number[]> = {};
    districts.forEach(d => {
      if (!provMap[d.provinsi]) provMap[d.provinsi] = [];
      const val = d[indicator];
      if (typeof val === 'number') provMap[d.provinsi].push(val);
    });

    const entries = Object.keys(provMap).map(prov => {
      const vals = provMap[prov];
      const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      return { prov, avg };
    });

    // Sort ascending so highest appears on top of horizontal bar
    entries.sort((a, b) => a.avg - b.avg);

    const allVals = districts.map(d => d[indicator]).filter(v => typeof v === 'number') as number[];
    const grandAvg = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;

    return {
      provNames: entries.map(e => e.prov),
      provValues: entries.map(e => Number(e.avg.toFixed(2))),
      nationalAvg: Number(grandAvg.toFixed(2))
    };
  }, [districts, indicator]);

  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        padding: [8, 12],
        textStyle: { color: '#1E293B', fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `
            <div style="font-weight: 700;">${item.name}</div>
            <div style="color: #0072B2; margin-top: 4px;">Rata-Rata: <strong>${item.value}${unit}</strong></div>
            <div style="font-size: 11px; color: #64748B;">Selisih vs Nasional: ${(item.value - nationalAvg).toFixed(2)}${unit}</div>
          `;
        }
      },
      grid: {
        top: 25,
        right: 40,
        bottom: 25,
        left: 140
      },
      xAxis: {
        type: 'value',
        name: unit,
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
        axisLabel: { color: '#64748B' }
      },
      yAxis: {
        type: 'category',
        data: provNames,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#1E293B', fontSize: 11, fontWeight: 500 }
      },
      series: [
        {
          name: indicatorLabel,
          type: 'bar',
          data: provValues,
          itemStyle: {
            color: '#0072B2',
            borderRadius: [0, 3, 3, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: `{c}${unit}`,
            fontSize: 10,
            color: '#475569'
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: { type: 'dashed', color: '#D55E00', width: 1.8 },
            label: { formatter: `Nasional: {c}${unit}`, position: 'end', color: '#D55E00', fontSize: 11 },
            data: [{ xAxis: nationalAvg }]
          }
        }
      ]
    };
  }, [indicatorLabel, unit, provNames, provValues, nationalAvg]);

  const echartsRef = useRef<any>(null);

  const handleExportImage = () => {
    const chart = echartsRef.current?.getEchartsInstance();
    if (!chart) return;
    const url = chart.getDataURL({
      pixelRatio: 2,
      backgroundColor: '#FFFFFF',
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `peringkat-provinsi-${indicator}.png`;
    a.click();
  };

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
      role="region"
      aria-label={`Peringkat Provinsi: ${indicatorLabel}`}
    >
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Peringkat Rata-Rata Provinsi: {indicatorLabel}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Perbandingan rata-rata provinsi terhadap garis acuan nasional ({nationalAvg}{unit})
          </p>
        </div>

        <button
          onClick={handleExportImage}
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors self-end sm:self-auto shrink-0"
          title="Unduh visualisasi grafik (PNG)"
          aria-label="Unduh grafik PNG"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor PNG</span>
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="w-full relative" role="img" aria-label={`Grafik batang horizontal peringkat 34 provinsi untuk indikator ${indicatorLabel}`}>
        <ReactECharts 
          ref={echartsRef}
          option={option} 
          style={{ height: '520px', width: '100%' }} 
          opts={{ renderer: 'canvas' }} 
        />

        {/* Screen reader data summary table */}
        <div className="sr-only">
          <h4>Peringkat Rata-Rata Provinsi untuk {indicatorLabel}</h4>
          <table>
            <thead>
              <tr>
                <th scope="col">Provinsi</th>
                <th scope="col">Rata-Rata ({unit})</th>
              </tr>
            </thead>
            <tbody>
              {provNames.map((name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{provValues[i]}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
