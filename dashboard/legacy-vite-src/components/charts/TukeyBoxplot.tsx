import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { Download } from 'lucide-react';

interface BoxplotProps {
  districts: District[];
}

export const TukeyBoxplot: React.FC<BoxplotProps> = ({ districts }) => {
  const { q1, median, q3, iqr, lowerWhisker, upperWhisker, outliers } = useMemo(() => {
    const p0Vals = districts.map(d => d.poverty_rate_p0).sort((a, b) => a - b);
    const n = p0Vals.length;

    const q1Val = p0Vals[Math.floor(n * 0.25)];
    const medVal = p0Vals[Math.floor(n * 0.5)];
    const q3Val = p0Vals[Math.floor(n * 0.75)];
    const iqrVal = q3Val - q1Val;
    const lower = Math.max(p0Vals[0], q1Val - 1.5 * iqrVal);
    const upper = Math.min(p0Vals[n - 1], q3Val + 1.5 * iqrVal);

    // Identify Tukey outliers (points > upperWhisker or < lowerWhisker)
    const outs = districts
      .filter(d => d.poverty_rate_p0 > upper || d.poverty_rate_p0 < lower)
      .map(d => [0, d.poverty_rate_p0, `${d.tipe_wilayah} ${d.kab_kota} (${d.provinsi})`]);

    return {
      q1: q1Val,
      median: medVal,
      q3: q3Val,
      iqr: iqrVal,
      lowerWhisker: lower,
      upperWhisker: upper,
      outliers: outs
    };
  }, [districts]);

  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        padding: [8, 12],
        textStyle: { color: '#1E293B', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesType === 'boxplot') {
            return `
              <div style="font-weight: 700;">Statistik Distribusi Tukey (P0 %)</div>
              <div style="border-top: 1px solid #F1F5F9; margin-top: 4px; padding-top: 4px;">
                <div>Batas Atas Whisker: <strong>${upperWhisker.toFixed(2)}%</strong></div>
                <div>Kuartil 3 (Q3): <strong>${q3.toFixed(2)}%</strong></div>
                <div>Median: <strong>${median.toFixed(2)}%</strong></div>
                <div>Kuartil 1 (Q1): <strong>${q1.toFixed(2)}%</strong></div>
                <div>Batas Bawah Whisker: <strong>${lowerWhisker.toFixed(2)}%</strong></div>
              </div>
            `;
          } else {
            return `
              <div style="font-weight: 700;">${params.value[2]}</div>
              <div style="color: #D55E00; margin-top: 2px;">Kemiskinan P0: <strong>${params.value[1]}%</strong> (Pencilan Luar Whisker)</div>
            `;
          }
        }
      },
      grid: {
        top: 25,
        right: 40,
        bottom: 30,
        left: 60
      },
      xAxis: {
        type: 'category',
        data: ['Distribusi Kemiskinan Moneter (P0 %)'],
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { fontWeight: 'bold', color: '#1E293B', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        name: 'Persentase Kemiskinan P0 (%)',
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
        axisLabel: { formatter: '{value}%', color: '#64748B' }
      },
      series: [
        {
          name: 'Boxplot Tukey',
          type: 'boxplot',
          data: [[lowerWhisker, q1, median, q3, upperWhisker]],
          itemStyle: {
            borderColor: '#0072B2',
            borderWidth: 2,
            color: 'rgba(0, 114, 178, 0.15)'
          }
        },
        {
          name: 'Pencilan (Outliers)',
          type: 'scatter',
          data: outliers,
          itemStyle: {
            color: '#D55E00',
            opacity: 0.8
          },
          symbolSize: 8
        }
      ]
    };
  }, [lowerWhisker, q1, median, q3, upperWhisker, outliers]);

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
    a.download = `boxplot-tukey-outlier-p0.png`;
    a.click();
  };

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
      role="region"
      aria-label="Inspeksi Outlier Teknis Boxplot Tukey"
    >
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Audit Pencilan Statistik: Sebaran Distribusi Tukey 1.5x IQR
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Q1: {q1.toFixed(2)}%, Med: {median.toFixed(2)}%, Q3: {q3.toFixed(2)}%, IQR: {iqr.toFixed(2)}% · {outliers.length} pencilan dipertahankan demi inklusi Leave No One Behind
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
      <div className="w-full relative" role="img" aria-label="Diagram boxplot Tukey menampilkan sebaran persentase kemiskinan dengan 26 pencilan luar whisker.">
        <ReactECharts 
          ref={echartsRef}
          option={option} 
          style={{ height: '300px', width: '100%' }} 
          opts={{ renderer: 'canvas' }} 
        />

        {/* Screen reader data summary table */}
        <div className="sr-only">
          <h4>Statistik Distribusi Boxplot Tukey</h4>
          <table>
            <tbody>
              <tr><td>Batas Atas Whisker</td><td>{upperWhisker.toFixed(2)}%</td></tr>
              <tr><td>Kuartil 3 (Q3)</td><td>{q3.toFixed(2)}%</td></tr>
              <tr><td>Median</td><td>{median.toFixed(2)}%</td></tr>
              <tr><td>Kuartil 1 (Q1)</td><td>{q1.toFixed(2)}%</td></tr>
              <tr><td>Batas Bawah Whisker</td><td>{lowerWhisker.toFixed(2)}%</td></tr>
              <tr><td>Jumlah Pencilan Ekstrem</td><td>{outliers.length} daerah</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
