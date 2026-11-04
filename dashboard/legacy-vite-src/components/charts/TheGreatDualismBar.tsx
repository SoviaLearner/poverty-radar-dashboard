import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { Download } from 'lucide-react';

interface DualismProps {
  districts: District[];
}

export const TheGreatDualismBar: React.FC<DualismProps> = ({ districts }) => {
  const { kabP0, kotaP0, kabTpt, kotaTpt, countKab, countKota } = useMemo(() => {
    const kabs = districts.filter(d => d.tipe_wilayah === 'Kabupaten');
    const kotas = districts.filter(d => d.tipe_wilayah === 'Kota');

    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      kabP0: mean(kabs.map(d => d.poverty_rate_p0)),
      kotaP0: mean(kotas.map(d => d.poverty_rate_p0)),
      kabTpt: mean(kabs.map(d => d.unemployment_rate_tpt)),
      kotaTpt: mean(kotas.map(d => d.unemployment_rate_tpt)),
      countKab: kabs.length,
      countKota: kotas.length,
    };
  }, [districts]);

  const hasBothTypes = countKab > 0 && countKota > 0;
  const p0Ratio = hasBothTypes && kotaP0 > 0 ? (kabP0 / kotaP0).toFixed(2) : 'N/A';
  const tptRatio = hasBothTypes && kabTpt > 0 ? (kotaTpt / kabTpt).toFixed(2) : 'N/A';

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
          const title = params[0]?.name;
          const kabVal = params[0]?.value;
          const kotaVal = params[1]?.value;
          const diff = Math.abs(kabVal - kotaVal).toFixed(2);
          return `
            <div style="font-weight: 700;">${title}</div>
            <div style="color: #0072B2; margin-top: 4px;">Kabupaten: <strong>${kabVal.toFixed(2)}%</strong></div>
            <div style="color: #E69F00;">Kota: <strong>${kotaVal.toFixed(2)}%</strong></div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px; border-top: 1px solid #F1F5F9; padding-top: 4px;">
              Selisih: ${diff} poin persentase
            </div>
          `;
        }
      },
      legend: {
        data: ['Kabupaten (Pedesaan)', 'Kota (Perkotaan)'],
        top: 8,
        right: 15,
        textStyle: { fontSize: 11, color: '#475569' }
      },
      grid: {
        top: 38,
        right: 45,
        bottom: 45,
        left: 180
      },
      xAxis: {
        type: 'value',
        name: 'Rata-Rata Persentase (%)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
        axisLabel: { formatter: '{value}%', color: '#64748B' }
      },
      yAxis: {
        type: 'category',
        data: ['Tingkat Kemiskinan (P0)', 'Tingkat Pengangguran (TPT)'],
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { fontWeight: 'bold', color: '#1E293B', fontSize: 11 }
      },
      series: [
        {
          name: 'Kabupaten (Pedesaan)',
          type: 'bar',
          data: [Number(kabP0.toFixed(2)), Number(kabTpt.toFixed(2))],
          itemStyle: { color: '#0072B2', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', formatter: '{c}%', fontWeight: 'bold', color: '#0072B2' }
        },
        {
          name: 'Kota (Perkotaan)',
          type: 'bar',
          data: [Number(kotaP0.toFixed(2)), Number(kotaTpt.toFixed(2))],
          itemStyle: { color: '#E69F00', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', formatter: '{c}%', fontWeight: 'bold', color: '#B84D00' }
        }
      ]
    };
  }, [kabP0, kotaP0, kabTpt, kotaTpt, countKab, countKota]);

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
    a.download = `the-great-dualism-kab-kota.png`;
    a.click();
  };

  return (
    <div className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3">
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            The Great Dualism: Jurang Kemiskinan vs Paradoks Pengangguran
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {hasBothTypes
              ? `Kabupaten ~${p0Ratio}x lebih miskin dari Kota, sebaliknya pengangguran terbuka Kota ~${tptRatio}x lebih tinggi.`
              : `Perbandingan tidak tersedia (${countKab} Kabupaten, ${countKota} Kota pada seleksi aktif).`}
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

      <div className="w-full relative" role="img" aria-label="Grafik batang komparasi dualisme kabupaten vs kota">
        <ReactECharts ref={echartsRef} option={option} style={{ height: '310px', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  );
};
