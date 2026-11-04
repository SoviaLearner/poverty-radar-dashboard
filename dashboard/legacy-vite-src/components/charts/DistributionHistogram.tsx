import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { Download } from 'lucide-react';

interface HistogramProps {
  districts: District[];
}

export const DistributionHistogram: React.FC<HistogramProps> = ({ districts }) => {
  const { binLabels, counts, nationalMedian, medianBinLabel } = useMemo(() => {
    const binSize = 3;
    const maxVal = 42;
    const bins: number[] = [];
    for (let b = 0; b <= maxVal; b += binSize) {
      bins.push(b);
    }

    const binCounts = new Array(bins.length - 1).fill(0);
    const labels: string[] = [];

    for (let i = 0; i < bins.length - 1; i++) {
      labels.push(`${bins[i]}–${bins[i + 1]}%`);
    }

    districts.forEach(d => {
      const val = d.poverty_rate_p0;
      for (let i = 0; i < bins.length - 1; i++) {
        if (val >= bins[i] && (i === bins.length - 2 ? val <= bins[i + 1] : val < bins[i + 1])) {
          binCounts[i]++;
          break;
        }
      }
    });

    const p0Sorted = districts.map(d => d.poverty_rate_p0).sort((a, b) => a - b);
    const mid = Math.floor(p0Sorted.length / 2);
    const med = p0Sorted.length % 2 !== 0 ? p0Sorted[mid] : (p0Sorted[mid - 1] + p0Sorted[mid]) / 2;
    const finalMedian = med || 10.46;

    // Determine bin containing median dynamically
    let medianBin = labels[0] || '0–3%';
    for (let i = 0; i < bins.length - 1; i++) {
      if (finalMedian >= bins[i] && (i === bins.length - 2 ? finalMedian <= bins[i + 1] : finalMedian < bins[i + 1])) {
        medianBin = labels[i];
        break;
      }
    }

    return { binLabels: labels, counts: binCounts, nationalMedian: finalMedian, medianBinLabel: medianBin };
  }, [districts]);

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
            <div style="font-weight: 700;">Interval: ${item.name}</div>
            <div style="color: #0072B2; margin-top: 4px;">Jumlah: <strong>${item.value} Kabupaten/Kota</strong></div>
            <div style="font-size: 11px; color: #64748B;">Porsi: ${((item.value / (districts.length || 1)) * 100).toFixed(1)}% dari total</div>
          `;
        }
      },
      grid: {
        top: 25,
        right: 25,
        bottom: 42,
        left: 45
      },
      xAxis: {
        type: 'category',
        data: binLabels,
        name: 'Kemiskinan P0 (%)',
        nameLocation: 'middle',
        nameGap: 24,
        nameTextStyle: { color: '#64748B', fontSize: 10, fontWeight: 600 },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          interval: 1,
          formatter: (_val: string, idx: number) => {
            return `${idx * 3}%`;
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Jumlah Daerah',
        nameTextStyle: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLabel: { color: '#64748B', fontSize: 11 }
      },
      series: [
        {
          name: 'Frekuensi Daerah',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#0072B2',
            borderRadius: [4, 4, 0, 0]
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: {
              formatter: `Median: ${nationalMedian.toFixed(2)}%`,
              position: 'insideEndTop',
              color: '#D55E00',
              fontWeight: 'bold',
              fontSize: 10,
              backgroundColor: '#FFF5EB',
              padding: [2, 6],
              borderRadius: 4
            },
            lineStyle: {
              type: 'dashed',
              color: '#D55E00',
              width: 1.8
            },
            data: [
              { xAxis: medianBinLabel }
            ]
          }
        }
      ]
    };
  }, [binLabels, counts, nationalMedian, medianBinLabel, districts.length]);

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
    a.download = `histogram-sebaran-kemiskinan.png`;
    a.click();
  };

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
      role="region"
      aria-label="Histogram Distribusi Frekuensi Kemiskinan Moneter"
    >
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Sebaran Menjulur ke Kanan: Mayoritas Daerah Terkonsentrasi di Bawah Median
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Frekuensi sebaran P0 (interval 3%) dengan ekor panjang 3T hingga 41.7% vs median nasional (10.46%)
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
      <div 
        className="w-full relative"
        role="img"
        aria-label="Histogram distribusi frekuensi tingkat kemiskinan 514 daerah di Indonesia."
      >
        <ReactECharts 
          ref={echartsRef}
          option={option} 
          style={{ height: '360px', width: '100%' }} 
          opts={{ renderer: 'canvas' }} 
        />

        {/* Screen reader summary table */}
        <div className="sr-only">
          <h4>Frekuensi Daerah per Interval Kemiskinan</h4>
          <table>
            <thead>
              <tr>
                <th scope="col">Interval Kemiskinan</th>
                <th scope="col">Frekuensi Daerah</th>
              </tr>
            </thead>
            <tbody>
              {binLabels.map((lbl, idx) => (
                <tr key={lbl}>
                  <td>{lbl}</td>
                  <td>{counts[idx]} daerah</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
