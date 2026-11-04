import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { District } from '../../types';
import { ClusterBadge, QuadrantBadge } from '../common/Badge';
import { MapPin, Info, ZoomIn, ZoomOut, RotateCcw, Download, ArrowLeft, Layers, Loader2 } from 'lucide-react';

interface IndonesiaMapProps {
  districts: District[];
  indicator: keyof District;
  indicatorLabel: string;
  unit: string;
}

interface ProvinceStats {
  provinceName: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  minDistrict: string;
  maxDistrict: string;
  kabCount: number;
  kotaCount: number;
  totalCount: number;
  dominantCluster: number;
  districts: District[];
}

// Mapping from BPS Susenas uppercase province names to GADM GeoJSON NAME_1
const PROV_NAME_MAPPING: Record<string, string> = {
  'DKI JAKARTA': 'Jakarta Raya',
  'D I YOGYAKARTA': 'Yogyakarta',
  'KEP. BANGKA BELITUNG': 'Bangka Belitung',
};

// Normalize district names to guarantee 100% key matching between GeoJSON and CSV
const normalizeDistrictName = (typeStr?: string, nameStr?: string): string => {
  const t = (typeStr || '').trim();
  let n = (nameStr || '').trim();
  n = n.replace(/^(kota|kabupaten|kab\.)\s+/i, '').trim();
  return t ? `${t} ${n}` : n;
};

// Centroid calculator for any set of GeoJSON features to center province map precisely
const getFeatureCentroid = (features: any[]): [number, number] => {
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  const traverse = (coords: any) => {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        traverse(item);
      }
    }
  };

  for (const f of features) {
    if (f.geometry?.coordinates) {
      traverse(f.geometry.coordinates);
    }
  }

  if (minLng === Infinity || minLat === Infinity) {
    return [118, -2.5]; // Fallback to Indonesia center
  }

  return [Number(((minLng + maxLng) / 2).toFixed(4)), Number(((minLat + maxLat) / 2).toFixed(4))];
};

export const IndonesiaChoroplethMap: React.FC<IndonesiaMapProps> = ({
  districts,
  indicator,
  indicatorLabel,
  unit,
}) => {
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  
  // Hierarchical spatial drill-down states
  const [mapLevel, setMapLevel] = useState<'national' | 'province'>('national');
  const [currentMapKey, setCurrentMapKey] = useState<string>('indonesia');
  const [provinceCenter, setProvinceCenter] = useState<[number, number] | undefined>(undefined);
  const [allDistrictsGeoJson, setAllDistrictsGeoJson] = useState<any>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);
  const [isDrilling, setIsDrilling] = useState<boolean>(false);

  const echartsRef = useRef<any>(null);

  // 1. Load national 34-provinces GeoJSON and register with ECharts once
  useEffect(() => {
    if (echarts.getMap('indonesia')) {
      setMapLoaded(true);
      return;
    }

    fetch('/data/indonesia-provinces.geojson')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(geoJson => {
        echarts.registerMap('indonesia', geoJson);
        setMapLoaded(true);
      })
      .catch(err => {
        console.error('Gagal memuat peta GeoJSON Indonesia:', err);
        setLoadError(true);
      });
  }, []);

  // 2. Preload districts GeoJSON in background for seamless drill-down
  useEffect(() => {
    fetch('/data/indonesia-districts-simple.geojson')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(geoJson => {
        setAllDistrictsGeoJson(geoJson);
      })
      .catch(err => {
        console.warn('Gagal memuat peta poligon kabupaten/kota:', err);
      });
  }, []);

  // Compute statistics per province
  const provinceStatsMap = useMemo(() => {
    const map = new Map<string, District[]>();
    districts.forEach(d => {
      const list = map.get(d.provinsi) || [];
      list.push(d);
      map.set(d.provinsi, list);
    });

    const stats: Record<string, ProvinceStats> = {};
    map.forEach((distList, prov) => {
      const vals = distList.map(d => ({ val: d[indicator] as number, name: d.kab_kota }))
        .filter(item => typeof item.val === 'number' && !isNaN(item.val));

      if (vals.length === 0) return;

      const sum = vals.reduce((acc, curr) => acc + curr.val, 0);
      const avg = sum / vals.length;

      let min = vals[0];
      let max = vals[0];
      vals.forEach(v => {
        if (v.val < min.val) min = v;
        if (v.val > max.val) max = v;
      });

      const kabCount = distList.filter(d => d.tipe_wilayah === 'Kabupaten').length;
      const kotaCount = distList.filter(d => d.tipe_wilayah === 'Kota').length;

      // Dominant cluster
      const clusterCounts: Record<number, number> = {};
      distList.forEach(d => {
        clusterCounts[d.cluster_id] = (clusterCounts[d.cluster_id] || 0) + 1;
      });
      let dominantClust = 0;
      let maxCount = -1;
      Object.entries(clusterCounts).forEach(([cid, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantClust = Number(cid);
        }
      });

      stats[prov] = {
        provinceName: prov,
        avgValue: Number(avg.toFixed(2)),
        minValue: Number(min.val.toFixed(2)),
        maxValue: Number(max.val.toFixed(2)),
        minDistrict: min.name,
        maxDistrict: max.name,
        kabCount,
        kotaCount,
        totalCount: distList.length,
        dominantCluster: dominantClust,
        districts: distList.sort((a, b) => (Number(b[indicator]) || 0) - (Number(a[indicator]) || 0))
      };
    });

    return stats;
  }, [districts, indicator]);

  // Negative metric detection (where high values represent disadvantage / vulnerability pressure)
  const isNegativeMetric = useMemo(() => {
    return indicator === 'poverty_rate_p0' || indicator === 'unemployment_rate_tpt' || indicator === 'labor_participation_tpak';
  }, [indicator]);

  // Color scales based on metric direction (Okabe-Ito inspired palette)
  const colorScale = useMemo(() => {
    if (indicator === 'labor_participation_tpak') {
      // Neutral-to-vermillion scale for TPAK to indicate subsistence work pressure without misleading "blue = good"
      return ['#F8FAFC', '#F0E442', '#E69F00', '#D55E00'];
    }
    return isNegativeMetric
      ? ['#0072B2', '#56B4E9', '#F0E442', '#E69F00', '#D55E00']
      : ['#D55E00', '#E69F00', '#F0E442', '#56B4E9', '#0072B2'];
  }, [isNegativeMetric, indicator]);

  // National min and max range
  const { nationalMinRange, nationalMaxRange } = useMemo(() => {
    const avgs = Object.values(provinceStatsMap).map(s => s.avgValue);
    if (avgs.length === 0) return { nationalMinRange: 0, nationalMaxRange: 100 };
    return {
      nationalMinRange: Math.floor(Math.min(...avgs)),
      nationalMaxRange: Math.ceil(Math.max(...avgs))
    };
  }, [provinceStatsMap]);

  const activeProvinceDetail = selectedProvince ? provinceStatsMap[selectedProvince] : null;

  // Drill down function: slices GeoJSON for target province and registers runtime map
  const drillDownToProvince = async (provName: string) => {
    setIsDrilling(true);
    try {
      let geo = allDistrictsGeoJson;
      if (!geo) {
        // Fetch on demand if not yet loaded
        const res = await fetch('/data/indonesia-districts-simple.geojson');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        geo = await res.json();
        setAllDistrictsGeoJson(geo);
      }

      const gadmTarget = PROV_NAME_MAPPING[provName] || provName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      
      // Filter district features for selected province
      const features = (geo.features || []).filter((f: any) => {
        const p = f.properties?.NAME_1 || '';
        return p.toLowerCase() === gadmTarget.toLowerCase();
      });

      if (features.length === 0) {
        console.warn(`Poligon kabupaten/kota tidak ditemukan untuk provinsi ${provName} (GADM: ${gadmTarget})`);
        setSelectedProvince(provName);
        setIsDrilling(false);
        return;
      }

      // Enrich features with normalized 'name' property for ECharts matching
      const enrichedFeatures = features.map((f: any) => {
        const normName = normalizeDistrictName(f.properties?.TYPE_2, f.properties?.NAME_2);
        return {
          ...f,
          properties: {
            ...f.properties,
            name: normName,
          }
        };
      });

      // Calculate centroid of province features to ensure perfect camera centering
      const center = getFeatureCentroid(enrichedFeatures);

      const provMapKey = `prov_${provName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      echarts.registerMap(provMapKey, {
        type: 'FeatureCollection',
        features: enrichedFeatures,
      });

      setProvinceCenter(center);
      setCurrentMapKey(provMapKey);
      setSelectedProvince(provName);
      setMapLevel('province');
      setSelectedDistrictName(null);
    } catch (err) {
      console.error('Error during province drill-down:', err);
      setSelectedProvince(provName);
    } finally {
      setIsDrilling(false);
    }
  };

  // Back to national map handler
  const handleBackToNationalMap = () => {
    setProvinceCenter(undefined);
    setCurrentMapKey('indonesia');
    setMapLevel('national');
    setSelectedDistrictName(null);
  };

  // Compute ECharts option dynamically based on map level (National vs Province)
  const option = useMemo(() => {
    if (mapLevel === 'national') {
      const nationalData = Object.values(provinceStatsMap).map(s => ({
        name: s.provinceName,
        value: s.avgValue,
        minValue: s.minValue,
        maxValue: s.maxValue,
        minDistrict: s.minDistrict,
        maxDistrict: s.maxDistrict,
        kabCount: s.kabCount,
        kotaCount: s.kotaCount,
        totalCount: s.totalCount,
        dominantCluster: s.dominantCluster
      }));

      return {
        backgroundColor: 'transparent',
        title: {
          text: `Peta Spasial Indonesia: Distribusi ${indicatorLabel} per Provinsi`,
          subtext: `Klik pada poligon provinsi untuk zoom dan membuka sebaran kabupaten/kota ${unit ? `(${unit})` : ''}`,
          left: 'left',
          top: 0,
          textStyle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
          subtextStyle: { fontSize: 11, color: '#64748B' }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: '#FFFFFF',
          borderColor: '#CBD5E1',
          borderWidth: 1,
          padding: [10, 14],
          textStyle: { color: '#0F172A', fontSize: 12 },
          formatter: (params: any) => {
            if (!params.data) return params.name;
            const d = params.data;
            return `
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px;">
                <div style="font-size: 13px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
                  ${d.name}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748B;">Rata-rata:</span>
                  <span style="font-weight: 700; color: #0284C7; font-family: 'JetBrains Mono', monospace;">${d.value}${unit}</span>
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
                  Disparitas Internal:
                  <br/>• Terendah: <b>${d.minDistrict}</b> (${d.minValue}${unit})
                  <br/>• Tertinggi: <b>${d.maxDistrict}</b> (${d.maxValue}${unit})
                </div>
                <div style="font-size: 11px; color: #64748B; border-top: 1px dashed #E2E8F0; padding-top: 4px; margin-top: 4px;">
                  Cakupan: ${d.kabCount} Kabupaten, ${d.kotaCount} Kota
                </div>
                <div style="font-size: 10px; color: #0284C7; font-weight: 600; margin-top: 6px;">
                  🔍 Klik poligon untuk zoom ke kab/kota
                </div>
              </div>
            `;
          }
        },
        visualMap: {
          min: nationalMinRange,
          max: nationalMaxRange,
          text: indicator === 'labor_participation_tpak'
            ? ['Tinggi (Tekanan Subsistensi)', 'Rendah (Pilihan Formal)']
            : (indicator === 'poverty_rate_p0' || indicator === 'unemployment_rate_tpt'
                ? ['Tinggi (Defisit)', 'Rendah (Aman)']
                : ['Tinggi (Unggul)', 'Rendah (Defisit)']),
          realtime: true,
          calculable: true,
          orient: 'horizontal',
          left: 'right',
          bottom: 10,
          inRange: { color: colorScale },
          textStyle: { fontSize: 10, color: '#64748B' }
        },
        series: [
          {
            name: indicatorLabel,
            type: 'map',
            map: 'indonesia',
            roam: true,
            zoom: 1.18,
            center: [118, -2.5],
            aspectScale: 0.9,
            emphasis: {
              label: { show: true, fontSize: 10, fontWeight: 'bold', color: '#0F172A' },
              itemStyle: {
                areaColor: '#FDE047',
                borderColor: '#0F172A',
                borderWidth: 1.5,
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.15)'
              }
            },
            select: {
              label: { show: true, color: '#0F172A', fontWeight: 'bold' },
              itemStyle: {
                areaColor: '#FBBF24',
                borderColor: '#0284C7',
                borderWidth: 2
              }
            },
            itemStyle: {
              borderColor: '#94A3B8',
              borderWidth: 0.8,
              areaColor: '#E2E8F0'
            },
            data: nationalData
          }
        ]
      };
    } else {
      // PROVINCE LEVEL DRILL-DOWN VIEW
      const provDistricts = activeProvinceDetail?.districts || [];
      const districtData = provDistricts.map(d => {
        const normName = normalizeDistrictName(d.tipe_wilayah, d.kab_kota);
        const val = Number(d[indicator]) || 0;
        return {
          name: normName,
          value: Number(val.toFixed(2)),
          rawDistrict: d,
          p0: d.poverty_rate_p0,
          selected: selectedDistrictName === normName
        };
      });

      // Adaptive local color scale: min and max strictly within this province
      const localMin = activeProvinceDetail ? Math.floor(activeProvinceDetail.minValue) : 0;
      const localMax = activeProvinceDetail ? Math.ceil(activeProvinceDetail.maxValue) : 100;

      return {
        backgroundColor: 'transparent',
        title: {
          text: `Peta Disparitas Daerah: Provinsi ${selectedProvince}`,
          subtext: `Menampilkan sebaran ${provDistricts.length} kabupaten/kota · Rentang lokal: ${activeProvinceDetail?.minValue}${unit} s.d. ${activeProvinceDetail?.maxValue}${unit}`,
          left: 'left',
          top: 0,
          textStyle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
          subtextStyle: { fontSize: 11, color: '#64748B' }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: '#FFFFFF',
          borderColor: '#CBD5E1',
          borderWidth: 1,
          padding: [10, 14],
          textStyle: { color: '#0F172A', fontSize: 12 },
          formatter: (params: any) => {
            if (!params.data) return params.name;
            const d = params.data;
            const raw: District = d.rawDistrict;
            return `
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px;">
                <div style="font-size: 13px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
                  ${d.name}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748B;">${indicatorLabel}:</span>
                  <span style="font-weight: 700; color: #0284C7; font-family: 'JetBrains Mono', monospace;">
                    ${d.value}${unit}
                  </span>
                </div>
                ${indicator !== 'poverty_rate_p0' ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748B;">Kemiskinan (P0):</span>
                  <span style="font-weight: 700; color: #D55E00; font-family: 'JetBrains Mono', monospace;">
                    ${d.p0}%
                  </span>
                </div>` : ''}
                <div style="font-size: 11px; color: #475569; border-top: 1px dashed #E2E8F0; padding-top: 4px; margin-top: 4px;">
                  Klaster: <b>Klaster ${raw?.cluster_id}</b> · ${raw?.vulnerability_quadrant}
                </div>
                <div style="font-size: 10px; color: #64748B; font-style: italic; margin-top: 4px;">
                  💡 Klik poligon untuk menyorot kartu daerah
                </div>
              </div>
            `;
          }
        },
        visualMap: {
          min: localMin,
          max: localMax,
          text: indicator === 'labor_participation_tpak'
            ? ['Tinggi (Tekanan Subsistensi)', 'Rendah (Pilihan Formal)']
            : (indicator === 'poverty_rate_p0' || indicator === 'unemployment_rate_tpt'
                ? ['Tinggi (Defisit)', 'Rendah (Aman)']
                : ['Tinggi (Unggul)', 'Rendah (Defisit)']),
          realtime: true,
          calculable: true,
          orient: 'horizontal',
          left: 'right',
          bottom: 10,
          inRange: { color: colorScale },
          textStyle: { fontSize: 10, color: '#64748B' }
        },
        series: [
          {
            name: indicatorLabel,
            type: 'map',
            map: currentMapKey,
            roam: true,
            zoom: 1.05,
            center: provinceCenter,
            aspectScale: 0.9,
            emphasis: {
              label: { show: true, fontSize: 10, fontWeight: 'bold', color: '#0F172A' },
              itemStyle: {
                areaColor: '#FDE047',
                borderColor: '#0F172A',
                borderWidth: 1.5,
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.15)'
              }
            },
            select: {
              label: { show: true, color: '#0F172A', fontWeight: 'bold' },
              itemStyle: {
                areaColor: '#FBBF24',
                borderColor: '#0284C7',
                borderWidth: 2
              }
            },
            itemStyle: {
              borderColor: '#64748B',
              borderWidth: 0.8,
              areaColor: '#E2E8F0'
            },
            data: districtData
          }
        ]
      };
    }
  }, [
    mapLevel,
    currentMapKey,
    provinceCenter,
    provinceStatsMap,
    indicatorLabel,
    unit,
    colorScale,
    nationalMinRange,
    nationalMaxRange,
    activeProvinceDetail,
    selectedProvince,
    selectedDistrictName,
    indicator
  ]);

  const onChartClick = (params: any) => {
    if (mapLevel === 'national') {
      if (params.name) {
        drillDownToProvince(params.name);
      }
    } else {
      if (params.name) {
        setSelectedDistrictName(params.name);
      }
    }
  };

  const handleZoomIn = () => {
    const chart = echartsRef.current?.getEchartsInstance();
    if (!chart) return;
    const currentOption = chart.getOption();
    const currentZoom = currentOption.series?.[0]?.zoom || 1.15;
    chart.setOption({ series: [{ zoom: Math.min(currentZoom * 1.3, 10) }] });
  };

  const handleZoomOut = () => {
    const chart = echartsRef.current?.getEchartsInstance();
    if (!chart) return;
    const currentOption = chart.getOption();
    const currentZoom = currentOption.series?.[0]?.zoom || 1.15;
    chart.setOption({ series: [{ zoom: Math.max(currentZoom / 1.3, 0.6) }] });
  };

  const handleResetZoom = () => {
    const chart = echartsRef.current?.getEchartsInstance();
    if (!chart) return;
    if (mapLevel === 'national') {
      chart.setOption({ series: [{ zoom: 1.18, center: [118.0, -2.5] }] });
    } else {
      chart.setOption({ series: [{ zoom: 1.05, center: provinceCenter }] });
    }
  };

  const handleExportImage = () => {
    const chart = echartsRef.current?.getEchartsInstance();
    if (!chart) return;
    const url = chart.getDataURL({
      pixelRatio: 2,
      backgroundColor: '#FFFFFF',
      excludeComponents: ['toolbox']
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `peta-spasial-${mapLevel === 'province' ? (selectedProvince || 'daerah').toLowerCase() : 'indonesia'}-${indicator}.png`;
    a.click();
  };

  return (
    <div className="space-y-4" role="region" aria-label={`Peta Tematik Spasial Indonesia: ${indicatorLabel}`}>
      {/* Map Container Card */}
      <div className="bg-surface rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-subtle relative">
        {/* Navigation Breadcrumb & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            {mapLevel === 'province' ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBackToNationalMap}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-okabe-blue text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
                  title="Kembali ke peta 34 provinsi Indonesia"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Kembali ke Peta Indonesia</span>
                </button>
                <span className="hidden sm:inline-flex items-center text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  Provinsi {selectedProvince} ({activeProvinceDetail?.totalCount} Daerah)
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-okabe-blue shrink-0" />
                <span>Peta 34 Provinsi · Klik poligon provinsi untuk zoom kabupaten/kota</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 self-end sm:self-auto shrink-0">
            {isDrilling && (
              <div className="flex items-center space-x-1 px-2 py-1 text-xs text-slate-500 font-medium animate-pulse mr-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-okabe-blue" />
                <span>Memuat Kab/Kota...</span>
              </div>
            )}

            {/* Zoom Controls */}
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              title="Perbesar Peta (Zoom In)"
              aria-label="Perbesar Peta"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              title="Perkecil Peta (Zoom Out)"
              aria-label="Perkecil Peta"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              title="Reset Skala Peta ke Posisi Awal"
              aria-label="Reset Skala Peta"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            
            {/* Export Snapshot Button */}
            <button
              onClick={handleExportImage}
              className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
              title="Unduh Gambar Peta Resolusi Tinggi (PNG)"
              aria-label="Unduh Gambar Peta"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ekspor PNG</span>
            </button>

            {selectedProvince && (
              <button
                onClick={() => {
                  setSelectedProvince(null);
                  if (mapLevel === 'province') {
                    handleBackToNationalMap();
                  }
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors ml-1 cursor-pointer"
                title="Tutup rincian provinsi"
              >
                <span>✕ Lepas Pilihan</span>
              </button>
            )}
          </div>
        </div>

        {/* ECharts Map Display */}
        {mapLoaded ? (
          <div 
            className="h-[460px] w-full relative"
            role="img"
            aria-label={`Visualisasi Peta Choropleth menampilkan indikator ${indicatorLabel} pada tingkat ${mapLevel === 'province' ? `Provinsi ${selectedProvince}` : 'Nasional'}.`}
          >
            <ReactECharts
              key={currentMapKey}
              ref={echartsRef}
              option={option}
              notMerge={true}
              lazyUpdate={false}
              style={{ height: '100%', width: '100%' }}
              onEvents={{ click: onChartClick }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        ) : loadError ? (
          <div className="h-[360px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <div className="text-center p-6 text-slate-600 text-xs">
              <Info className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Peta Poligon GeoJSON Tidak Dapat Dimuat</p>
              <p className="mt-1">Gunakan tab "Peringkat Batang 34 Provinsi" di atas sebagai representasi spasial alternatif.</p>
            </div>
          </div>
        ) : (
          <div className="h-[460px] flex items-center justify-center bg-slate-50 rounded-xl animate-pulse">
            <span className="text-xs font-semibold text-slate-600">Memuat Poligon Peta Geospasial Indonesia...</span>
          </div>
        )}
      </div>

      {/* Selected Province Inspector Drawer / Detail Box */}
      {activeProvinceDetail && (
        <div className="bg-white rounded-2xl border-2 border-okabe-blue/30 p-5 shadow-md transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-okabe-blue">
                  Inspektur Disparitas Wilayah
                </span>
                {mapLevel === 'national' && (
                  <button
                    onClick={() => drillDownToProvince(activeProvinceDetail.provinceName)}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-300 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Zoom ke Peta Provinsi Ini</span>
                  </button>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-ink-primary mt-1">
                PROVINSI {activeProvinceDetail.provinceName}
              </h3>
              <p className="text-xs text-slate-500">
                Total {activeProvinceDetail.totalCount} Daerah ({activeProvinceDetail.kabCount} Kabupaten, {activeProvinceDetail.kotaCount} Kota)
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-slate-500">Rata-Rata {indicatorLabel}</div>
                <div className="text-xl font-black text-okabe-blue font-mono">
                  {activeProvinceDetail.avgValue}{unit}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProvince(null);
                  if (mapLevel === 'province') {
                    handleBackToNationalMap();
                  }
                }}
                className="text-xs text-slate-400 hover:text-slate-600 px-2.5 py-1 border border-slate-200 rounded-md cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>
          </div>

          {/* District List Grid */}
          <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
            <span>Sebaran Kabupaten/Kota di {activeProvinceDetail.provinceName} (Diurutkan Tertinggi ke Terendah):</span>
            {selectedDistrictName && (
              <span className="text-okabe-blue font-bold">
                Tersorot: {selectedDistrictName}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1">
            {activeProvinceDetail.districts.map(d => {
              const normName = normalizeDistrictName(d.tipe_wilayah, d.kab_kota);
              const isSelected = selectedDistrictName === normName;
              return (
                <div
                  key={d.kab_kota}
                  onClick={() => setSelectedDistrictName(isSelected ? null : normName)}
                  className={`p-2.5 rounded-lg border transition flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-okabe-blue ring-2 ring-okabe-blue/40 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-okabe-blue/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="font-bold text-slate-800 truncate text-xs">{d.kab_kota}</span>
                    <span className="text-[11px] text-slate-500 shrink-0 font-medium">{d.tipe_wilayah}</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-500">{indicatorLabel}:</span>
                    <span className="font-mono font-bold text-xs text-ink-primary">
                      {Number(d[indicator])?.toFixed(2)}{unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                    <ClusterBadge clusterId={d.cluster_id} />
                    <QuadrantBadge quadrantName={d.vulnerability_quadrant} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
