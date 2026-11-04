import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { District } from '../../types';
import { CLUSTER_COLORS } from '../../constants/okabeItoPalette';
import { Download } from 'lucide-react';

interface StripPlotProps {
  districts: District[];
  onSelectDistrict?: (district: District) => void;
}

interface IslandStat {
  name: string;
  count: number;
  median: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
}

export const ArchipelagoStripPlot: React.FC<StripPlotProps> = ({ districts }) => {
  // Compute distribution metrics and rank islands descending by median poverty rate
  const islandStats = useMemo<IslandStat[]>(() => {
    const rawIslands = [
      "Maluku & Papua",
      "Bali & Nusa Tenggara",
      "Sulawesi",
      "Jawa",
      "Sumatera",
      "Kalimantan"
    ];

    return rawIslands.map(name => {
      const p0List = districts
        .filter(d => d.region_pulau === name)
        .map(d => d.poverty_rate_p0)
        .sort((a, b) => a - b);

      if (p0List.length === 0) {
        return { name, count: 0, median: 0, min: 0, max: 0, p25: 0, p75: 0 };
      }

      const n = p0List.length;
      const mid = Math.floor(n / 2);
      const median = n % 2 !== 0 ? p0List[mid] : (p0List[mid - 1] + p0List[mid]) / 2;
      const p25 = p0List[Math.floor(n * 0.25)];
      const p75 = p0List[Math.floor(n * 0.75)];

      return {
        name,
        count: n,
        median,
        min: p0List[0],
        max: p0List[n - 1],
        p25,
        p75
      };
    }).sort((a, b) => b.median - a.median);
  }, [districts]);

  // Reverse order for ECharts Cartesian Y-axis so highest median appears at the top
  const yAxisCategories = useMemo(() => {
    return [...islandStats].reverse().map(s => s.name);
  }, [islandStats]);

  const statsMap = useMemo(() => {
    const map = new Map<string, IslandStat>();
    islandStats.forEach(s => map.set(s.name, s));
    return map;
  }, [islandStats]);

  const option = useMemo(() => {
    const nationalMedian = 10.46;

    // 1. Min-Max Range whisker lines
    const rangeLinesData: any[] = [];
    // 2. Interquartile Range (IQR, P25–P75) core bands
    const iqrLinesData: any[] = [];
    // 3. Median marker points
    const medianPointsData: any[] = [];

    yAxisCategories.forEach((islName, yIdx) => {
      const stat = statsMap.get(islName);
      if (!stat || stat.count === 0) return;

      rangeLinesData.push([
        { coord: [stat.min, yIdx] },
        { coord: [stat.max, yIdx] }
      ]);

      iqrLinesData.push([
        { coord: [stat.p25, yIdx] },
        { coord: [stat.p75, yIdx] }
      ]);

      const isHighPriority = stat.median >= 20.0;
      medianPointsData.push({
        name: stat.name,
        value: [stat.median, yIdx],
        stat,
        itemStyle: {
          color: isHighPriority ? '#D55E00' : '#0F172A',
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        label: {
          show: isHighPriority,
          position: 'top',
          distance: 5,
          formatter: `${stat.median.toFixed(1)}%`,
          fontSize: 10,
          fontWeight: 'bold',
          color: '#D55E00',
        }
      });
    });

    // Key national outliers with direct labels (immune to jitter drift)
    const OUTLIER_CONFIG: Record<string, { label: string; position: 'top' | 'bottom' | 'left' | 'right' }> = {
      'Kota Sawah Lunto': { label: 'Sawahlunto (2.38%)', position: 'bottom' },
      'Sampang': { label: 'Sampang (23.8%)', position: 'top' },
      'Nias Barat': { label: 'Nias Barat (26.4%)', position: 'top' },
      'Intan Jaya': { label: 'Intan Jaya (41.7%)', position: 'left' },
    };

    // 4. District points clamped strictly within row tracks (+-0.10)
    const scatterPointsData = districts.map((d, i) => {
      const yIdx = yAxisCategories.indexOf(d.region_pulau);
      if (yIdx === -1) return null;

      const pseudoJitter = ((Math.sin(i * 12.9898 + d.poverty_rate_p0) * 43758.5453) % 1) * 0.20 - 0.10;
      const outlierCfg = OUTLIER_CONFIG[d.kab_kota];

      return {
        name: d.kab_kota,
        value: [d.poverty_rate_p0, yIdx + pseudoJitter],
        rawDistrict: d,
        itemStyle: {
          color: CLUSTER_COLORS[d.cluster_id] || '#0072B2',
          opacity: outlierCfg ? 1 : 0.35,
          borderColor: outlierCfg ? '#0F172A' : '#FFFFFF',
          borderWidth: outlierCfg ? 1.5 : 0.4,
        },
        symbolSize: outlierCfg ? 8.5 : 4.5,
        label: outlierCfg ? {
          show: true,
          formatter: outlierCfg.label,
          position: outlierCfg.position,
          distance: 5,
          fontSize: 9.5,
          fontWeight: 'bold',
          color: '#0F172A',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#CBD5E1',
          borderWidth: 0.5,
          borderRadius: 4,
          padding: [1.5, 4],
          shadowColor: 'rgba(0, 0, 0, 0.08)',
          shadowBlur: 3,
        } : undefined
      };
    }).filter(Boolean);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1E293B', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-radius: 8px;',
      },
      grid: {
        top: 26,
        right: 20,
        bottom: 34,
        left: 130
      },
      xAxis: {
        type: 'value',
        name: 'Kemiskinan P0 (%)',
        nameLocation: 'middle',
        nameGap: 20,
        nameTextStyle: { fontSize: 9.5, fontWeight: 'bold', color: '#475569' },
        min: 0,
        max: 45,
        interval: 10,
        splitLine: { show: false },
        axisLine: { show: true, lineStyle: { color: '#CBD5E1' } },
        axisTick: { show: true, lineStyle: { color: '#CBD5E1' } },
        axisLabel: { formatter: '{value}%', color: '#64748B', fontSize: 9.5 },
      },
      yAxis: {
        type: 'category',
        data: yAxisCategories,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        splitArea: { show: false },
        axisLabel: {
          color: '#1E293B',
          fontWeight: 700,
          fontSize: 10,
          formatter: (isl: string) => {
            const stat = statsMap.get(isl);
            if (!stat) return isl;
            return `{title|${isl}}\n{sub|(N=${stat.count} · Med: ${stat.median.toFixed(1)}%)}`;
          },
          rich: {
            title: { fontWeight: 'bold', color: '#1E293B', fontSize: 10.5, lineHeight: 14 },
            sub: { color: '#64748B', fontSize: 9, lineHeight: 12 }
          }
        }
      },
      series: [
        // Whisker: Min - Max Range
        {
          name: 'Rentang Min-Maks',
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          z: 2,
          lineStyle: {
            color: '#E2E8F0',
            width: 2.5,
            cap: 'round',
          },
          silent: true,
          data: rangeLinesData,
        },
        // Core Band: IQR (P25 - P75)
        {
          name: 'Rentang Antarkuartil (IQR)',
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          z: 3,
          lineStyle: {
            color: '#CBD5E1',
            width: 6,
            cap: 'round',
          },
          silent: true,
          data: iqrLinesData,
        },
        // Individual District Scatter Points
        {
          name: 'Kabupaten/Kota',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          z: 4,
          data: scatterPointsData,
          tooltip: {
            formatter: (params: any) => {
              const d: District = params.data?.rawDistrict;
              if (!d) return '';
              return `
                <div style="font-weight: 700;">${d.tipe_wilayah} ${d.kab_kota}</div>
                <div style="color: #64748B; font-size: 11px;">${d.provinsi} · ${d.region_pulau}</div>
                <div style="border-top: 1px solid #F1F5F9; margin-top: 4px; padding-top: 4px; font-size: 11px;">
                  <div>Kemiskinan P0: <strong style="color: #D55E00;">${d.poverty_rate_p0.toFixed(2)}%</strong></div>
                  <div>Klaster: <strong style="color: ${CLUSTER_COLORS[d.cluster_id]};">${d.cluster_name.split(':')[0]}</strong></div>
                </div>
              `;
            }
          }
        },
        // Median Markers
        {
          name: 'Median Regional',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          z: 5,
          symbol: 'diamond',
          symbolSize: 12,
          data: medianPointsData,
          tooltip: {
            formatter: (params: any) => {
              const s: IslandStat = params.data?.stat;
              if (!s) return '';
              return `
                <div style="font-weight: 700; margin-bottom: 2px;">Kawasan ${s.name}</div>
                <div style="color: #64748B; font-size: 11px; margin-bottom: 4px;">Cakupan: ${s.count} Kabupaten/Kota</div>
                <div style="border-top: 1px solid #F1F5F9; padding-top: 4px; font-size: 11px;">
                  <div>Median Regional: <strong style="color: #D55E00;">${s.median.toFixed(2)}%</strong></div>
                  <div>Rentang IQR (P25–P75): <strong>${s.p25.toFixed(2)}% – ${s.p75.toFixed(2)}%</strong></div>
                  <div>Rentang Ekstrem (Min–Maks): <strong>${s.min.toFixed(2)}% – ${s.max.toFixed(2)}%</strong></div>
                </div>
              `;
            }
          }
        },
        // Reference Lines: RPJMN Target (7.00%) & National Median (10.46%)
        {
          name: 'Garis Rujukan Kebijakan',
          type: 'line',
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            data: [
              {
                xAxis: 7.00,
                lineStyle: { type: 'dashed', color: '#047857', width: 1.5 },
                label: {
                  formatter: 'Target RPJMN: 7.0%',
                  position: 'end',
                  align: 'right',
                  color: '#047857',
                  fontSize: 9.5,
                  fontWeight: 'bold',
                  distance: 6,
                }
              },
              {
                xAxis: nationalMedian,
                lineStyle: { type: 'dashed', color: '#DC2626', width: 1.5 },
                label: {
                  formatter: 'Median RI: 10.46%',
                  position: 'end',
                  align: 'left',
                  color: '#DC2626',
                  fontSize: 9.5,
                  fontWeight: 'bold',
                  distance: 6,
                }
              }
            ]
          }
        }
      ]
    };
  }, [districts, yAxisCategories, statsMap]);

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
    a.download = `strip-plot-kemiskinan-kepulauan.png`;
    a.click();
  };

  return (
    <div 
      className="bg-surface rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-subtle flex flex-col justify-between h-full"
      role="region"
      aria-label="Jittered Strip Plot Sebaran Kemiskinan Moneter per Wilayah Kepulauan"
    >
      {/* Chart Header & Action Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 shrink-0">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            {districts.length < 514 
              ? `Polarisasi Antar-Kepulauan: Sebaran ${districts.length} Daerah Terfilter` 
              : "Polarisasi Antar-Kepulauan: Konsentrasi 86.9% Kantong Akut di Kawasan Timur"}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {districts.length < 514
              ? `Sebaran ${districts.length} daerah vs median nasional (10.46%) & sasaran RPJMN (7.0%)`
              : "Sebaran 514 daerah di 6 gugus pulau vs median nasional (10.46%) & sasaran RPJMN (7.0%)"}
          </p>
        </div>

        <button
          onClick={handleExportImage}
          className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10.5px] font-semibold rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          title="Unduh visualisasi grafik (PNG)"
          aria-label="Unduh grafik PNG"
        >
          <Download className="w-3 h-3" />
          <span>Ekspor PNG</span>
        </button>
      </div>

      {/* Chart Visualization */}
      <div 
        className="w-full flex-1 min-h-[295px] relative flex flex-col justify-center" 
        role="img" 
        aria-label="Jittered strip plot menampilkan 514 titik kabupaten/kota di 6 gugus pulau dengan penanda median regional."
      >
        <ReactECharts
          ref={echartsRef}
          option={option}
          style={{ height: '100%', minHeight: '295px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
        />

        {/* Screen reader data summary table */}
        <div className="sr-only">
          <h4>Ringkasan Statistik Sebaran Kemiskinan per Gugus Kepulauan</h4>
          <table>
            <thead>
              <tr>
                <th scope="col">Kepulauan</th>
                <th scope="col">Jumlah Daerah</th>
                <th scope="col">Median P0</th>
                <th scope="col">Rentang Min - Maks</th>
              </tr>
            </thead>
            <tbody>
              {islandStats.map(s => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.count}</td>
                  <td>{s.median.toFixed(2)}%</td>
                  <td>{s.min.toFixed(2)}% - {s.max.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
