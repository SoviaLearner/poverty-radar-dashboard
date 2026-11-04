import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { OLSResult } from '../../types';
import { Download } from 'lucide-react';

interface OLSProps {
  olsResults: OLSResult[];
}

export const OLSCoefficientsBar: React.FC<OLSProps> = ({ olsResults }) => {
  const sorted = useMemo(() => [...olsResults].reverse(), [olsResults]);
  const labels = useMemo(() => sorted.map(d => d.label), [sorted]);
  const betas = useMemo(() => sorted.map(d => d.beta), [sorted]);

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
          const raw = sorted[item.dataIndex];
          return `
            <div style="font-weight: 700;">${raw.label}</div>
            <div style="color: ${item.color}; margin-top: 4px;">Asosiasi Relatif Baku (β): <strong>${raw.beta > 0 ? '+' : ''}${raw.beta}</strong></div>
            <div style="font-size: 11px; color: #64748B;">Nilai t: ${raw.t_stat} | p-value: ${raw.p_val < 0.001 ? '< 0.001' : raw.p_val.toFixed(4)} (${raw.significance})</div>
            <div style="font-size: 10px; color: #94A3B8; margin-top: 3px;">Asosiasi statistik linier multivariat, bukan hubungan sebab-akibat.</div>
          `;
        }
      },
      grid: {
        top: 20,
        right: 45,
        bottom: 45,
        left: 250
      },
      xAxis: {
        type: 'value',
        name: 'Koefisien Baku (β)',
        nameLocation: 'middle',
        nameGap: 28,
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
        axisLabel: { color: '#64748B' }
      },
      yAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#1E293B', fontSize: 11, fontWeight: 600 }
      },
      series: [
        {
          name: 'Koefisien Baku (β)',
          type: 'bar',
          data: betas.map((b, i) => ({
            value: b,
            itemStyle: {
              color: b < 0 ? '#0072B2' : '#D55E00',
              borderRadius: b < 0 ? [3, 0, 0, 3] : [0, 3, 3, 0]
            },
            label: {
              show: true,
              position: b < 0 ? 'left' : 'right',
              formatter: `${b > 0 ? '+' : ''}${b} ${sorted[i].significance}`,
              fontWeight: 'bold',
              fontSize: 10,
              color: b < 0 ? '#0072B2' : '#D55E00'
            }
          })),
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: { type: 'solid', color: '#0F172A', width: 1.5 },
            data: [{ xAxis: 0 }]
          }
        }
      ]
    };
  }, [betas, labels, sorted]);

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
    a.download = `koefisien-regresi-ols-multivariat.png`;
    a.click();
  };

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
      role="region"
      aria-label="Grafik Koefisien Regresi Terstandarisasi Baku OLS"
    >
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Pengaruh Relatif Determinan Struktural: Koefisien Baku OLS Multivariat
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Estimasi kovariansi linier ceteris paribus (R² = 51.64%, p &lt; 0.001) · [Asosiasi Statistik] Bukan hubungan kausal langsung
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
      <div className="w-full relative" role="img" aria-label="Diagram batang horizontal koefisien regresi baku OLS multivariat.">
        <ReactECharts 
          ref={echartsRef}
          option={option} 
          style={{ height: '320px', width: '100%' }} 
          opts={{ renderer: 'canvas' }} 
        />

        {/* Screen reader data summary table */}
        <div className="sr-only">
          <h4>Hasil Estimasi Regresi Terstandarisasi Baku OLS</h4>
          <table>
            <thead>
              <tr>
                <th scope="col">Variabel Indikator</th>
                <th scope="col">Koefisien Baku (Beta)</th>
                <th scope="col">t-statistik</th>
                <th scope="col">Signifikansi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => (
                <tr key={row.feature}>
                  <td>{row.label}</td>
                  <td>{row.beta}</td>
                  <td>{row.t_stat}</td>
                  <td>{row.significance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
