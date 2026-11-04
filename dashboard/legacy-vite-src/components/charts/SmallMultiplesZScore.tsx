import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { CLUSTER_COLORS } from '../../constants/okabeItoPalette';
import { Download } from 'lucide-react';

interface SmallMultiplesProps {
  districts: District[];
  allDistricts?: District[];
}

export const SmallMultiplesZScore: React.FC<SmallMultiplesProps> = ({ districts, allDistricts }) => {
  const features = useMemo(() => [
    { key: 'sanitation_access_pct', label: 'Sanitasi Layak' },
    { key: 'clean_water_access_pct', label: 'Air Terlindung' },
    { key: 'avg_school_years', label: 'Lama Sekolah (RLS)' },
    { key: 'expenditure_per_capita', label: 'Pengeluaran Riil' },
    { key: 'life_expectancy', label: 'Harapan Hidup (UHH)' },
    { key: 'log_pdrb', label: 'Log-PDRB' },
    { key: 'unemployment_rate_tpt', label: 'TPT Rendah (Inv)' },
  ], []);

  // Compute baseline mean & std using full national dataset (anchors Z=0 to national population)
  const baselineDistricts = (allDistricts && allDistricts.length > 0) ? allDistricts : districts;
  const stats = useMemo(() => {
    const s: Record<string, { mean: number; std: number }> = {};
    features.forEach(f => {
      const vals = baselineDistricts.map(d => Number(d[f.key as keyof District]));
      const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
      s[f.key] = { mean, std: Math.sqrt(variance) || 1 };
    });
    return s;
  }, [baselineDistricts, features]);

  // Compute z-scores for each of the 4 clusters against the anchored national baseline
  const clusterZScores = useMemo(() => {
    const res: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [] };
    for (let c = 0; c < 4; c++) {
      const cDistricts = districts.filter(d => d.cluster_id === c);
      features.forEach(f => {
        if (cDistricts.length === 0) {
          res[c].push(0);
        } else {
          const cVals = cDistricts.map(d => Number(d[f.key as keyof District]));
          const cMean = cVals.reduce((a, b) => a + b, 0) / cVals.length;
          const rawZ = (cMean - stats[f.key].mean) / stats[f.key].std;
          // Invert TPT so lower unemployment is positive (+, advantageous)
          const z = f.key === 'unemployment_rate_tpt' ? -rawZ : rawZ;
          res[c].push(Number(z.toFixed(2)));
        }
      });
    }
    return res;
  }, [districts, features, stats]);

  // Dynamic cluster legend with runtime counts
  const clusterNames = useMemo(() => {
    const baseNames = [
      "Klaster 1: Perkotaan Modern & Formal",
      "Klaster 2: Kab. Penyangga Mapan",
      "Klaster 3: Perdesaan Agraris Rentan",
      "Klaster 4: Wilayah 3T Deprivasi Akut"
    ];
    return baseNames.map((name, c) => {
      const cDistricts = districts.filter(d => d.cluster_id === c);
      return `${name} (N=${cDistricts.length})`;
    });
  }, [districts]);

  const option = useMemo(() => {
    const featureLabels = features.map(f => f.label);

    const n0 = districts.filter(d => d.cluster_id === 0).length;
    const n1 = districts.filter(d => d.cluster_id === 1).length;
    const n2 = districts.filter(d => d.cluster_id === 2).length;
    const n3 = districts.filter(d => d.cluster_id === 3).length;

    return {
      title: [
        {
          text: `Klaster 1: Perkotaan Modern (N=${n0})`,
          top: 6,
          left: 135,
          textStyle: { fontSize: 11, fontWeight: 'bold', color: CLUSTER_COLORS[0] }
        },
        {
          text: `Klaster 2: Penyangga Mapan (N=${n1})`,
          top: 6,
          left: '60%',
          textStyle: { fontSize: 11, fontWeight: 'bold', color: CLUSTER_COLORS[1] }
        },
        {
          text: `Klaster 3: Perdesaan Agraris (N=${n2})`,
          top: '52%',
          left: 135,
          textStyle: { fontSize: 11, fontWeight: 'bold', color: CLUSTER_COLORS[2] }
        },
        {
          text: `Klaster 4: 3T Deprivasi Akut (N=${n3})`,
          top: '52%',
          left: '60%',
          textStyle: { fontSize: 11, fontWeight: 'bold', color: CLUSTER_COLORS[3] }
        },
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        padding: [8, 12],
        textStyle: { color: '#1E293B', fontSize: 12 },
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          if (!item) return '';
          const zVal = item.value;
          const status = zVal >= 0 ? 'Di atas rata-rata nasional' : 'Di bawah rata-rata nasional (Defisit)';
          return `
            <div style="font-weight: 700; color: #0F172A;">${item.name}</div>
            <div style="color: ${item.color}; margin-top: 4px; font-weight: 600;">Z-Score: <strong>${zVal > 0 ? '+' : ''}${zVal} SD</strong></div>
            <div style="font-size: 11px; color: #64748B;">Status: ${status}</div>
          `;
        }
      },
      grid: [
        { left: 135, right: '53%', top: 34, height: '42%' },
        { left: '60%', right: 25, top: 34, height: '42%' },
        { left: 135, right: '53%', top: '58%', height: '38%' },
        { left: '60%', right: 25, top: '58%', height: '38%' },
      ],
      xAxis: [0, 1, 2, 3].map(i => ({
        gridIndex: i,
        type: 'value',
        min: -3.0,
        max: 2.2,
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
        axisLabel: { formatter: '{value}σ', fontSize: 10, color: '#64748B' }
      })),
      yAxis: [
        { gridIndex: 0, type: 'category', data: featureLabels, axisLabel: { fontSize: 10, fontWeight: 600, color: '#1E293B' } },
        { gridIndex: 1, type: 'category', data: featureLabels, show: false },
        { gridIndex: 2, type: 'category', data: featureLabels, axisLabel: { fontSize: 10, fontWeight: 600, color: '#1E293B' } },
        { gridIndex: 3, type: 'category', data: featureLabels, show: false }
      ],
      series: [0, 1, 2, 3].map(c => {
        const color = CLUSTER_COLORS[c];
        return {
          name: clusterNames[c],
          type: 'bar',
          xAxisIndex: c,
          yAxisIndex: c,
          data: clusterZScores[c].map(val => ({
            value: val,
            itemStyle: {
              color: color,
              borderRadius: val >= 0 ? [0, 3, 3, 0] : [3, 0, 0, 3]
            }
          })),
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: { type: 'solid', color: '#0F172A', width: 1.5 },
            data: [{ xAxis: 0 }]
          }
        };
      })
    };
  }, [clusterNames, clusterZScores, districts, features]);

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
    a.download = `small-multiples-zscore-klaster.png`;
    a.click();
  };

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
      role="region"
      aria-label="Small Multiples Z-Score Profil Standarisasi 4 Klaster"
    >
      {/* Chart Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Profil Struktural 4 Klaster: Konfigurasi Defisit Fasilitas Dasar (Anchor Z = 0)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Deviasi terstandarisasi 7 indikator terhadap acuan populasi nasional (bebas kebocoran target P0)
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
        aria-label="Grafik batang small multiples 4 kolom menampilkan profil deviasi Z-Score untuk Klaster 1 hingga Klaster 4."
      >
        <ReactECharts 
          ref={echartsRef}
          option={option} 
          style={{ height: '560px', width: '100%' }} 
          opts={{ renderer: 'canvas' }} 
        />

        {/* Screen reader data summary */}
        <div className="sr-only">
          <h4>Deviasi Z-Score Rata-Rata per Klaster</h4>
          <table>
            <thead>
              <tr>
                <th scope="col">Indikator</th>
                {clusterNames.map((name, i) => (
                  <th key={i} scope="col">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, fIdx) => (
                <tr key={f.key}>
                  <td>{f.label}</td>
                  {clusterNames.map((_, cIdx) => (
                    <td key={cIdx}>{clusterZScores[cIdx]?.[fIdx]?.toFixed(2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
