import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { Download } from 'lucide-react';

interface HeatmapProps {
  districts: District[];
  allDistricts?: District[];
}

export const ClusterHeatmap: React.FC<HeatmapProps> = ({ districts, allDistricts }) => {
  const features = useMemo(() => [
    { key: 'sanitation_access_pct', label: 'Sanitasi' },
    { key: 'clean_water_access_pct', label: 'Air Bersih' },
    { key: 'avg_school_years', label: 'Lama Sekolah' },
    { key: 'expenditure_per_capita', label: 'Pengeluaran' },
    { key: 'life_expectancy', label: 'UHH Hidup' },
    { key: 'log_pdrb', label: 'Log-PDRB' },
    { key: 'unemployment_rate_tpt', label: 'TPT (Inv)' },
  ], []);

  const clusterLabels = [
    "Klaster 1 (Perkotaan)",
    "Klaster 2 (Penyangga)",
    "Klaster 3 (Agraris)",
    "Klaster 4 (3T Akut)"
  ];

  // Compute baseline mean & std using full national dataset (anchors Z=0 to national population)
  const baselineDistricts = (allDistricts && allDistricts.length > 0) ? allDistricts : districts;

  // Compute z-scores for 28 cells [featureIdx, clusterIdx, zScore] against anchored national baseline
  const data = useMemo(() => {
    const s: Record<string, { mean: number; std: number }> = {};
    features.forEach(f => {
      const vals = baselineDistricts.map(d => Number(d[f.key as keyof District]));
      const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
      s[f.key] = { mean, std: Math.sqrt(variance) || 1 };
    });

    const matrix: [number, number, number | null][] = [];
    for (let c = 0; c < 4; c++) {
      const cDistricts = districts.filter(d => d.cluster_id === c);
      features.forEach((f, fIdx) => {
        if (cDistricts.length === 0) {
          matrix.push([fIdx, 3 - c, null]);
        } else {
          const cVals = cDistricts.map(d => Number(d[f.key as keyof District]));
          const cMean = cVals.reduce((a, b) => a + b, 0) / cVals.length;
          const rawZ = (cMean - s[f.key].mean) / s[f.key].std;
          // Invert Z-score for TPT: low unemployment is positive (+, blue), high unemployment is deficit (-, vermillion)
          const z = f.key === 'unemployment_rate_tpt' ? -rawZ : rawZ;
          matrix.push([fIdx, 3 - c, Number(z.toFixed(2))]); // invert Y so Klaster 1 is on top
        }
      });
    }
    return matrix;
  }, [districts, baselineDistricts, features]);

  const option = useMemo(() => {
    return {
      tooltip: {
        position: 'top',
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        padding: [8, 12],
        textStyle: { color: '#1E293B', fontSize: 12 },
        formatter: (params: any) => {
          const fName = features[params.value[0]].label;
          const cName = clusterLabels[3 - params.value[1]];
          const zVal = params.value[2];
          const isTpt = features[params.value[0]].key === 'unemployment_rate_tpt';
          if (zVal === null || zVal === undefined) {
            return `
              <div style="font-weight: 700;">${cName}</div>
              <div style="color: #64748B; font-size: 11px;">Indikator: ${fName}</div>
              <div style="margin-top: 4px; border-top: 1px solid #F1F5F9; padding-top: 4px; color: #94A3B8;">
                <em>Tidak ada data pada filter ini</em>
              </div>
            `;
          }
          return `
            <div style="font-weight: 700;">${cName}</div>
            <div style="color: #64748B; font-size: 11px;">Indikator: ${fName} ${isTpt ? '(Skala Terbalik: Positif = Pengangguran Rendah)' : ''}</div>
            <div style="margin-top: 4px; border-top: 1px solid #F1F5F9; padding-top: 4px;">
              Z-Score vs Acuan Nasional: <strong>${zVal > 0 ? '+' : ''}${zVal} SD</strong>
            </div>
          `;
        }
      },
      grid: {
        top: 25,
        right: 35,
        bottom: 68,
        left: 155
      },
      xAxis: {
        type: 'category',
        data: features.map(f => f.label),
        splitArea: { show: true },
        axisLabel: { color: '#1E293B', fontWeight: 600, fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: [...clusterLabels].reverse(),
        splitArea: { show: true },
        axisLabel: { color: '#1E293B', fontWeight: 600, fontSize: 11 }
      },
      visualMap: {
        min: -2.8,
        max: 1.8,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 6,
        inRange: {
          color: ['#D55E00', '#E69F00', '#F8FAFC', '#56B4E9', '#0072B2']
        },
        text: ['+1.8σ Unggul', '-2.8σ Defisit'],
        textStyle: { color: '#64748B', fontSize: 10 }
      },
      series: [
        {
          name: 'Z-Score Karakteristik',
          type: 'heatmap',
          data: data,
          label: {
            show: true,
            formatter: (p: any) => p.value[2] === null || p.value[2] === undefined ? 'N/A' : `${p.value[2] > 0 ? '+' : ''}${p.value[2]}`,
            color: '#0F172A',
            fontWeight: 'bold',
            fontSize: 11
          },
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 2
          }
        }
      ]
    };
  }, [data, features]);

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
    a.download = `matriks-karakteristik-klaster-heatmap.png`;
    a.click();
  };

  return (
    <div className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3">
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Matriks Karakteristik Klaster (28 Sel Z-Score Divergen)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Biru (#0072B2) = Unggul di atas rata-rata nasional · Vermillion (#D55E00) = Defisit kritis di bawah rata-rata (Palet Okabe-Ito)
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

      <div className="w-full relative" role="img" aria-label="Matriks Heatmap 28 sel deviasi Z-score">
        <ReactECharts ref={echartsRef} option={option} style={{ height: '380px', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  );
};
