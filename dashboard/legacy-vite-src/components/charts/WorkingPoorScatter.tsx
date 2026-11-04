import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { CLUSTER_COLORS } from '../../constants/okabeItoPalette';
import { EPISTEMIC_DISCLAIMER } from '../../constants/paradoxes';
import { Download } from 'lucide-react';

interface WorkingPoorProps {
  districts: District[];
}

export const WorkingPoorScatter: React.FC<WorkingPoorProps> = ({ districts }) => {
  // Compute real linear regression trendline (OLS) and Pearson correlation
  const { rValue, regressionData, hasEnoughSample } = useMemo(() => {
    const n = districts.length;
    if (n < 3) {
      return { rValue: null, regressionData: [], hasEnoughSample: false };
    }

    let sumX = 0;
    let sumY = 0;
    let minX = Infinity;
    let maxX = -Infinity;

    for (const d of districts) {
      const x = d.labor_participation_tpak;
      const y = d.poverty_rate_p0;
      sumX += x;
      sumY += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (const d of districts) {
      const dx = d.labor_participation_tpak - meanX;
      const dy = d.poverty_rate_p0 - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    if (denX > 0 && denY > 0) {
      const m = num / denX;
      const c = meanY - m * meanX;
      const r = num / Math.sqrt(denX * denY);
      const yStart = m * minX + c;
      const yEnd = m * maxX + c;

      return {
        rValue: r,
        regressionData: [
          [
            { coord: [Math.round(minX * 100) / 100, Math.round(yStart * 100) / 100] },
            { coord: [Math.round(maxX * 100) / 100, Math.round(yEnd * 100) / 100] }
          ]
        ],
        hasEnoughSample: true,
      };
    }

    return { rValue: null, regressionData: [], hasEnoughSample: false };
  }, [districts]);

  const option = useMemo(() => {
    const data = districts.map(d => ({
      value: [d.labor_participation_tpak, d.poverty_rate_p0],
      rawDistrict: d,
      itemStyle: {
        color: CLUSTER_COLORS[d.cluster_id] || '#0072B2',
        opacity: 0.85
      }
    }));
          [
            { coord: [Math.round(minX * 100) / 100, Math.round(yStart * 100) / 100] },
            { coord: [Math.round(maxX * 100) / 100, Math.round(yEnd * 100) / 100] }
          ]
        ];
      }
    }

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        padding: [8, 12],
        textStyle: { color: '#1E293B', fontSize: 12 },
        formatter: (params: any) => {
          const d: District = params.data?.rawDistrict;
          if (!d) return '';
          return `
            <div style="font-weight: 700;">${d.tipe_wilayah} ${d.kab_kota}</div>
            <div style="color: #64748B; font-size: 11px;">${d.provinsi}</div>
            <div style="border-top: 1px solid #F1F5F9; margin-top: 4px; padding-top: 4px;">
              <div>TPAK: <strong>${d.labor_participation_tpak.toFixed(2)}%</strong></div>
              <div>Kemiskinan P0: <strong style="color: #D55E00;">${d.poverty_rate_p0.toFixed(2)}%</strong></div>
              <div>Pengangguran TPT: <strong>${d.unemployment_rate_tpt.toFixed(2)}%</strong></div>
              <div style="font-size: 10px; color: #94A3B8; margin-top: 3px;">Asosiasi bivariat linier, bukan kausalitas.</div>
            </div>
          `;
        }
      },
      grid: {
        top: 25,
        right: 30,
        bottom: 45,
        left: 55
      },
      xAxis: {
        type: 'value',
        name: 'Partisipasi Kerja (TPAK %)',
        nameLocation: 'middle',
        nameGap: 26,
        nameTextStyle: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
        min: 55,
        max: 100,
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
        axisLabel: { formatter: '{value}%', color: '#64748B' }
      },
      yAxis: {
        type: 'value',
        name: 'Tingkat Kemiskinan (P0 %)',
        nameLocation: 'middle',
        nameGap: 36,
        nameTextStyle: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
        min: 0,
        max: 43,
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLabel: { formatter: '{value}%', color: '#64748B' }
      },
      series: [
        {
          name: 'Daerah',
          type: 'scatter',
          symbolSize: 7,
          data: data,
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: {
              formatter: `Garis Tren OLS (r = ${r >= 0 ? '+' : ''}${r.toFixed(3)}, Asosiasi Linier)`,
              position: 'insideEndTop',
              color: '#0072B2',
              fontWeight: 'bold',
              fontSize: 10
            },
            lineStyle: {
              type: 'dashed',
              color: '#0072B2',
              width: 1.8
            },
            data: regressionData
          }
        }
      ]
    };
  }, [districts]);

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
    a.download = `scatter-the-working-poor.png`;
    a.click();
  };

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
      role="region"
      aria-label="Scatter Plot Korelasi Positif Paradoks Ketenagakerjaan The Working Poor"
    >
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            The Working Poor: Tekanan Kerja Subsistensi vs Kemiskinan
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {hasEnoughSample && rValue !== null
              ? `Asosiasi linier (r = ${rValue >= 0 ? '+' : ''}${rValue.toFixed(3)}): warga wilayah miskin dominan bekerja subsistensi bertahan hidup · ${EPISTEMIC_DISCLAIMER}`
              : `Korelasi (r = N/A): sampel daerah tidak mencukupi (n < 3) · ${EPISTEMIC_DISCLAIMER}`}
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
        aria-label="Diagram scatter plot menampilkan 514 daerah mengilustrasikan asosiasi linier positif antara TPAK dan tingkat kemiskinan."
      >
        <ReactECharts 
          ref={echartsRef}
          option={option} 
          style={{ height: '340px', width: '100%' }} 
          opts={{ renderer: 'canvas' }} 
        />
      </div>
    </div>
  );
};
