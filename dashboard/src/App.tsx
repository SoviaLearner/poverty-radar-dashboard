import { useEffect, useMemo, useState } from 'react'

type District = {
  provinsi: string; kab_kota: string; tipe_wilayah: string; region_pulau: string; cluster_id: number; cluster_name: string
  vulnerability_score: number; vulnerability_quadrant: string; poverty_rate_p0: number; avg_school_years: number
  expenditure_per_capita: number; human_dev_index: number; life_expectancy: number; sanitation_access_pct: number
  clean_water_access_pct: number; unemployment_rate_tpt: number; labor_participation_tpak: number
  grdp_constant_million_idr: number; log_pdrb: number; is_multivariate_anomaly: boolean; anomaly_score: number
}
type GeoFeature = { properties: { name?: string; Propinsi?: string }; geometry: { type: string; coordinates: unknown } }
type GeoRing = number[][]
type GeoPolygon = GeoRing[]
type PageId = 'overview' | 'map' | 'clusters' | 'screening' | 'method'

const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })
const fmt2 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const idr = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
const percent = (n: number, digits = 1) => `${new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)}%`
const BLUE = '#0072B2', AMBER = '#E69F00', GREEN = '#009E73', ORANGE = '#D55E00', GRAY = '#999999', NAVY = '#102A43', RED = '#D55E00'
const clusterColors = [BLUE, '#56B4E9', AMBER, ORANGE]
const navItems: { id: PageId; step: string; label: string; icon: string; title: string; subtitle: string }[] = [
  { id: 'overview', step: '01 · GAMBARAN UMUM', label: 'Gambaran umum', icon: '▦', title: 'P0 tertinggi mencapai 17,5 kali nilai terendah', subtitle: 'Gambaran kemiskinan di 514 kabupaten/kota, berdasarkan data BPS 2021.' },
  { id: 'map', step: '02 · LIHAT PETA', label: 'Peta daerah', icon: '⌖', title: 'P0 dan layanan dasar berbeda antarprovinsi', subtitle: 'Pilih indikator untuk membandingkan rerata kabupaten/kota di tiap provinsi.' },
  { id: 'clusters', step: '03 · PROFIL DAERAH', label: 'Kelompok daerah', icon: '⑂', title: 'Empat profil wilayah, dengan kebutuhan yang berbeda', subtitle: 'Kelompok dibentuk dari tujuh indikator; P0 dipakai untuk membandingkan hasilnya.' },
  { id: 'screening', step: '04 · DAERAH UNTUK DITELAAH', label: 'Daerah untuk ditelaah', icon: '⚑', title: 'Daerah dengan P0 dan kerentanan tinggi perlu ditelaah', subtitle: 'Hasil ini membantu menyusun daftar awal untuk ditinjau bersama pemerintah daerah.' },
  { id: 'method', step: '05 · TENTANG DATA', label: 'Tentang data', icon: '▤', title: 'Data dan cara analisis', subtitle: 'Sumber data, indikator, pemeriksaan nilai, dan langkah analisis.' },
]

const parseCsvRow = (line: string) => {
  const cells: string[] = []; let cell = ''; let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++ }
    else if (ch === '"') quoted = !quoted
    else if (ch === ',' && !quoted) { cells.push(cell); cell = '' }
    else cell += ch
  }
  cells.push(cell); return cells
}

function parseDistricts(csv: string): District[] {
  const lines = csv.trim().split(/\r?\n/), headers = parseCsvRow(lines[0])
  return lines.slice(1).filter(Boolean).map(line => {
    const cells = parseCsvRow(line), row: Record<string, string> = {}
    headers.forEach((header, index) => { row[header] = cells[index] ?? '' })
    return { ...row, cluster_id: Number(row.cluster_id), vulnerability_score: Number(row.vulnerability_score), poverty_rate_p0: Number(row.poverty_rate_p0), avg_school_years: Number(row.avg_school_years), expenditure_per_capita: Number(row.expenditure_per_capita), human_dev_index: Number(row.human_dev_index), life_expectancy: Number(row.life_expectancy), sanitation_access_pct: Number(row.sanitation_access_pct), clean_water_access_pct: Number(row.clean_water_access_pct), unemployment_rate_tpt: Number(row.unemployment_rate_tpt), labor_participation_tpak: Number(row.labor_participation_tpak), grdp_constant_million_idr: Number(row.grdp_constant_million_idr), log_pdrb: Number(row.log_pdrb), anomaly_score: Number(row.anomaly_score), is_multivariate_anomaly: row.is_multivariate_anomaly.toLowerCase() === 'true' } as District
  })
}

function Panel({ eyebrow, title, description, children, className = '' }: { eyebrow: string; title: string; description?: string; children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-head"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</section>
}

function Header({ page, count }: { page: typeof navItems[number]; count: number }) {
  return <header className="page-head"><div><span className="eyebrow">{page.step}</span><h1>{page.title}</h1><p>{page.subtitle}</p></div><div className="header-meta"><span className="header-count">{count} wilayah · 34 provinsi</span><span className="next-badge" aria-label="Dibangun dengan Next.js"><b>N</b><span>Next.js</span></span></div></header>
}

function SideBar({ page, setPage, count }: { page: PageId; setPage: (id: PageId) => void; count: number }) {
  return <aside className="sidebar"><a className="brand" href="#top" onClick={() => setPage('overview')}><span className="brand-mark">1</span><span><b>PovertyWatch</b><small>SDGs · INDONESIA</small></span></a><div className="dataset-status"><i/>Data siap digunakan<small>{count || '…'} kabupaten/kota · 34 provinsi</small></div><nav aria-label="Navigasi dashboard">{navItems.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}><span className="nav-icon">{item.icon}</span><span><small>{item.step}</small>{item.label}</span></button>)}</nav><div className="sidebar-foot"><b>TENTANG DATA</b><p>Data BPS 2021 mencakup 514 kabupaten/kota di 34 provinsi.</p><small>SDG 1 · TANPA KEMISKINAN</small></div></aside>
}

function Bars({ rows, max, unit = '%', color = BLUE, digits = 1 }: { rows: { name: string; value: number; count?: number; color?: string }[]; max: number; unit?: string; color?: string; digits?: number }) {
  const ticks = [0, .25, .5, .75, 1]
  return <div className="bars" role="list">{rows.map(row => <div className="bar-row" key={row.name} role="listitem" tabIndex={0} aria-label={`${row.name}: ${fmtValue(row.value, digits)}${unit}`}><span className="bar-name" title={row.name}>{row.name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, row.value / max * 100))}%`, background: row.color ?? color }}/></div><span className="bar-value">{fmtValue(row.value, digits)}{unit}</span><span className="bar-tooltip" role="tooltip">{row.name}: <b>{fmtValue(row.value, digits)}{unit}</b>{row.count !== undefined && <small>{fmt.format(row.count)} wilayah</small>}</span></div>)}<div className="bar-scale"><span/><div>{ticks.map(t => <span key={t}>{fmtValue(max * t, 0)}</span>)}</div><span/></div></div>
}

function fmtValue(n: number, digits = 1) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: digits === 0 ? 0 : digits }).format(n) }
function average(rows: District[], key: keyof District) { return rows.length ? rows.reduce((sum, row) => sum + Number(row[key]), 0) / rows.length : 0 }
function standardDeviation(rows: District[], key: keyof District, mean = average(rows, key)) { return rows.length ? Math.sqrt(rows.reduce((sum, row) => sum + (Number(row[key]) - mean) ** 2, 0) / rows.length) || 1 : 1 }
function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2 }
function quartiles(values: number[]) { const sorted = [...values].sort((a,b)=>a-b); const q=(p:number)=>{const pos=(sorted.length-1)*p,base=Math.floor(pos);return sorted[base]+((sorted[base+1]??sorted[base])-sorted[base])*(pos-base)}; return { min: sorted[0], q1:q(.25), median:q(.5), q3:q(.75), max:sorted.at(-1) ?? 0 } }
function titleCase(s: string) { return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) }

function Overview({ rows, allRows, setProvince, province }: { rows: District[]; allRows: District[]; setProvince: (v: string) => void; province: string }) {
  const vals = rows.map(r => r.poverty_rate_p0), low = [...rows].sort((a,b)=>a.poverty_rate_p0-b.poverty_rate_p0)[0], high = [...rows].sort((a,b)=>b.poverty_rate_p0-a.poverty_rate_p0)[0]
  const meanP0 = average(rows, 'poverty_rate_p0'), med = median(vals), ratio = high && low ? high.poverty_rate_p0 / low.poverty_rate_p0 : 0
  const histogram = Array.from({ length: 9 }, (_, i) => { const start=i*5,end=start+5; return { name:`${start}–${end}%`, value:rows.filter(r=>r.poverty_rate_p0>=start && (i===8 ? r.poverty_rate_p0<=end : r.poverty_rate_p0<end)).length } })
  const provinceRows = [...new Set(allRows.map(r=>r.provinsi))].map(name=>({name,value:average(allRows.filter(r=>r.provinsi===name),'poverty_rate_p0')})).sort((a,b)=>b.value-a.value).slice(0,7)
  const districtsVsCities = [{name:'Kabupaten',value:average(rows.filter(r=>r.tipe_wilayah==='Kabupaten'),'poverty_rate_p0'),count:rows.filter(r=>r.tipe_wilayah==='Kabupaten').length,color:ORANGE},{name:'Kota',value:average(rows.filter(r=>r.tipe_wilayah==='Kota'),'poverty_rate_p0'),count:rows.filter(r=>r.tipe_wilayah==='Kota').length,color:BLUE}]
  const acute=rows.filter(r=>r.poverty_rate_p0>=20).length
  return <><div className="filter-toolbar"><label>Cakupan data<select value={province} onChange={e=>setProvince(e.target.value)}><option value="all">Semua provinsi</option>{[...new Set(allRows.map(r=>r.provinsi))].sort().map(p=><option key={p} value={p}>{titleCase(p)}</option>)}</select></label></div>
    <div className="kpi-grid chart-enter"><article className="kpi-card"><span>Rerata P0</span><strong>{percent(meanP0)}</strong><small>Median daerah {percent(med)}</small></article><article className="kpi-card"><span>P0 terendah</span><strong>{percent(low?.poverty_rate_p0 ?? 0)}</strong><small>{low?.kab_kota} · {titleCase(low?.provinsi ?? '')}</small></article><article className="kpi-card accent"><span>P0 tertinggi</span><strong>{percent(high?.poverty_rate_p0 ?? 0)}</strong><small>{high?.kab_kota} · {titleCase(high?.provinsi ?? '')}</small></article><article className="kpi-card"><span>Jarak tertinggi–terendah</span><strong>{fmt.format(ratio)}×</strong><small>Rasio P0 tertinggi terhadap terendah</small></article></div>
    <div className="overview-grid chart-enter"><Panel eyebrow="SEBARAN P0" title="Paling banyak wilayah berada pada P0 5–15%" description="Jumlah kabupaten/kota pada tiap rentang. Garis putus-putus menunjukkan median dalam cakupan yang dipilih."><div className="histogram">{histogram.map((bin,i)=><div className="hist-col" key={bin.name} tabIndex={0} title={`${bin.name}: ${bin.value} kabupaten/kota`} aria-label={`${bin.name}: ${bin.value} kabupaten/kota`}><span className="hist-count">{bin.value || ''}</span><div className={`hist-bar ${i>=4?'tail':''}`} style={{height:`${Math.max(2,bin.value/Math.max(1,...histogram.map(x=>x.value))*100)}%`}}/><span className="hist-label">{bin.name}</span></div>)}<div className="median-guide" style={{left:`${Math.min(98,Math.max(2,med/45*100))}%`}}><span>Median {percent(med)}</span></div></div><div className="hist-foot"><span><b>{acute}</b> wilayah memiliki P0 ≥ 20%</span><span>{rows.length} kabupaten/kota</span></div></Panel>
      <Panel eyebrow="RERATA P0 TERTINGGI" title={`${provinceRows[0]?.name ? titleCase(provinceRows[0].name) : '—'} mencatat rerata tertinggi`}><div className="rank-list">{provinceRows.map((r,i)=><div className="rank-row" key={r.name} tabIndex={0} aria-label={`${titleCase(r.name)}: ${percent(r.value)}, ${allRows.filter(d=>d.provinsi===r.name).length} kabupaten/kota`}><small>{String(i+1).padStart(2,'0')}</small><b>{titleCase(r.name)}</b><span>{fmt.format(allRows.filter(d=>d.provinsi===r.name).length)} kab/kota</span><strong>{percent(r.value)}</strong><div className="rank-track"><i style={{width:`${r.value/45*100}%`}}/></div></div>)}</div></Panel></div>
    <Panel eyebrow="KABUPATEN DAN KOTA" title="Rerata P0 kabupaten lebih tinggi daripada kota" description="Ini perbandingan deskriptif. Angka ini tidak menjelaskan penyebab perbedaan."><div className="admin-compare">{districtsVsCities.map(item=><div className="admin-row" key={item.name}><div><b>{item.name}</b><small>{fmt.format(item.count ?? 0)} wilayah</small></div><div className="admin-track" tabIndex={0} title={`${item.name}: ${percent(item.value)}, ${item.count} kabupaten/kota`} aria-label={`${item.name}: ${percent(item.value)}, ${item.count} kabupaten/kota`}><i style={{width:`${item.value/25*100}%`,background:item.color}}/></div><strong>{percent(item.value)}</strong></div>)}</div></Panel>
  </>
}

const mapIndicators = [
  { key:'poverty_rate_p0' as const, label:'Kemiskinan (P0)', unit:'%', max:45 },
  { key:'sanitation_access_pct' as const, label:'Sanitasi layak', unit:'%', max:100 },
  { key:'clean_water_access_pct' as const, label:'Air minum layak', unit:'%', max:100 },
  { key:'avg_school_years' as const, label:'Lama sekolah', unit:' th', max:13 },
  { key:'unemployment_rate_tpt' as const, label:'Pengangguran (TPT)', unit:'%', max:15 },
  { key:'labor_participation_tpak' as const, label:'Partisipasi kerja (TPAK)', unit:'%', max:100 },
]
function normalizeProvince(s: string) { return s.toUpperCase().replace('NUSA TENGGARA BARAT','NUSA TENGGARA BARAT').replace('DI YOGYAKARTA','D I YOGYAKARTA').replace('DAERAH ISTIMEWA YOGYAKARTA','D I YOGYAKARTA').replace('JAKARTA RAYA','DKI JAKARTA').replace('BANGKA BELITUNG','KEP. BANGKA BELITUNG') }
function getPoints(coords: unknown, points: [number,number][] = []): [number,number][] { if (Array.isArray(coords)) { if (typeof coords[0]==='number' && typeof coords[1]==='number') points.push([coords[0],coords[1]]); else coords.forEach(c=>getPoints(c,points)) } return points }
function getRings(geometry: GeoFeature['geometry']): GeoPolygon[] { const c=geometry.coordinates as unknown as GeoPolygon | GeoPolygon[]; return geometry.type==='Polygon' ? [c as GeoPolygon] : c as GeoPolygon[] }

function ProvinceMap({ rows, indicator, onIndicatorChange }: { rows: District[]; indicator: typeof mapIndicators[number]; onIndicatorChange: (key: string) => void }) {
  const [features,setFeatures]=useState<GeoFeature[]>([]),[error,setError]=useState(''),[selected,setSelected]=useState('PAPUA'),[hovered,setHovered]=useState<{name:string;left:number;top:number}|null>(null)
  useEffect(()=>{fetch('/data/indonesia-provinces.geojson').then(r=>{if(!r.ok)throw new Error('Geometri provinsi tidak tersedia');return r.json()}).then(j=>setFeatures(j.features as GeoFeature[])).catch(e=>setError(e.message))},[])
  const provinceStats=useMemo(()=>new Map([...new Set(rows.map(r=>r.provinsi))].map(name=>{const districts=rows.filter(r=>normalizeProvince(r.provinsi)===normalizeProvince(name));const lowest=[...districts].sort((a,b)=>Number(a[indicator.key])-Number(b[indicator.key]))[0];const highest=[...districts].sort((a,b)=>Number(b[indicator.key])-Number(a[indicator.key]))[0];return [normalizeProvince(name),{value:average(districts,indicator.key),count:districts.length,lowest,highest}] as const})),[rows,indicator])
  const extents=useMemo(()=>{const pts=features.flatMap(f=>getPoints(f.geometry.coordinates));return {minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxY:Math.max(...pts.map(p=>p[1]))}},[features])
  const sx=(lon:number)=>20+(lon-extents.minX)/(extents.maxX-extents.minX||1)*960, sy=(lat:number)=>20+(extents.maxY-lat)/(extents.maxY-extents.minY||1)*430
  const stats=[...provinceStats.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.value-a.value), selectedName=normalizeProvince(selected), chosen=provinceStats.get(selectedName), selectedLabel=titleCase(selectedName)
  const avg=chosen?.value ?? 0
  const color=(v:number)=>{const p=Math.max(0,Math.min(1,v/indicator.max));return p<.25?'#0072B2':p<.5?'#56B4E9':p<.7?'#F1F3F4':p<.85?'#E69F00':'#D55E00'}
  const moveTooltip=(event:React.MouseEvent<SVGGElement>,name:string)=>{const bounds=event.currentTarget.closest('.map-canvas')?.getBoundingClientRect();if(!bounds)return;setHovered({name,left:Math.max(8,Math.min(event.clientX-bounds.left+14,bounds.width-260)),top:Math.max(8,Math.min(event.clientY-bounds.top-18,bounds.height-116))})}
  const hoveredStats=hovered?provinceStats.get(hovered.name):undefined
  return <><div className="filter-toolbar map-toolbar"><span>Pilih indikator untuk membandingkan kondisi antarprovinsi.</span><label>Indikator<select value={indicator.key} onChange={e=>onIndicatorChange(e.target.value)}>{mapIndicators.map(x=><option value={x.key} key={x.key}>{x.label}</option>)}</select></label></div><div className="map-grid chart-enter"><Panel eyebrow="PETA · 34 PROVINSI" title={`Rerata ${indicator.label} per provinsi`} description="Pilih provinsi pada peta untuk melihat rinciannya. Warna bergerak dari biru (nilai rendah) ke jingga (nilai tinggi)."><div className="map-canvas" onMouseLeave={()=>setHovered(null)}>{error?<div className="error">{error}</div>:!features.length?<div className="loading">Memuat peta provinsi…</div>:<svg viewBox="0 0 1000 470" role="img" aria-label={`Peta Indonesia berwarna menurut rerata ${indicator.label} per provinsi`}>
    {features.map((feature,i)=>{const name=normalizeProvince(feature.properties.name||feature.properties.Propinsi||'');const stats=provinceStats.get(name);const value=stats?.value??0;return <g key={`${name}-${i}`} role="button" tabIndex={0} aria-label={`${titleCase(name)}: rerata ${fmtValue(value,1)}${indicator.unit}; ${stats?.count??0} kabupaten/kota`} onClick={()=>setSelected(name)} onMouseEnter={event=>moveTooltip(event,name)} onMouseMove={event=>moveTooltip(event,name)} onFocus={()=>setHovered({name,left:12,top:12})} onBlur={()=>setHovered(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setSelected(name)}} className={`province-shape ${selectedName===name?'selected':''}`} fill={provinceStats.has(name)?color(value):'#E5E7EB'}>{getRings(feature.geometry).map((polygon,pi)=><path key={pi} d={polygon.map(ring=>ring.map((p,j)=>`${j?'L':'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ')+'Z').join(' ')}><title>{`${titleCase(name)} · rerata ${fmtValue(value,1)}${indicator.unit} · ${stats?.count??0} kabupaten/kota`}</title></path>)}</g>})}
  </svg>}{hovered&&hoveredStats&&<div className="map-tooltip" style={{left:hovered.left,top:hovered.top}}><b>{titleCase(hovered.name)}</b><span>Rerata {indicator.label.toLowerCase()}: <strong>{fmtValue(hoveredStats.value,1)}{indicator.unit}</strong></span><span>Cakupan: <strong>{hoveredStats.count} kabupaten/kota</strong></span>{hoveredStats.lowest&&<small>Terendah: {hoveredStats.lowest.kab_kota} ({fmtValue(Number(hoveredStats.lowest[indicator.key]),1)}{indicator.unit})</small>}{hoveredStats.highest&&<small>Tertinggi: {hoveredStats.highest.kab_kota} ({fmtValue(Number(hoveredStats.highest[indicator.key]),1)}{indicator.unit})</small>}<em>Klik peta untuk memilih provinsi</em></div>}<div className="map-legend"><span>Rendah</span><i className="map-ramp"/><span>Tinggi</span><small>{indicator.label} · {fmtValue(indicator.max,0)}{indicator.unit}</small></div></div></Panel><aside className="province-card"><span className="eyebrow">RINGKASAN PROVINSI</span><h3>{selectedLabel}</h3><strong>{fmtValue(avg,1)}<small>{indicator.unit}</small></strong><small>{chosen?.count??0} kabupaten/kota</small><hr/><span>Rerata P0</span><b>{percent(average(rows.filter(r=>normalizeProvince(r.provinsi)===selectedName),'poverty_rate_p0'))}</b><span>Sanitasi layak</span><b>{percent(average(rows.filter(r=>normalizeProvince(r.provinsi)===selectedName),'sanitation_access_pct'))}</b><span>Air minum layak</span><b>{percent(average(rows.filter(r=>normalizeProvince(r.provinsi)===selectedName),'clean_water_access_pct'))}</b><span>Lama sekolah</span><b>{fmtValue(average(rows.filter(r=>normalizeProvince(r.provinsi)===selectedName),'avg_school_years'),1)} th</b></aside></div><div className="overview-grid"><Panel eyebrow="PERBANDINGAN PROVINSI" title={`Delapan provinsi dengan rerata ${indicator.label.toLowerCase()} tertinggi`}><div className="rank-list">{stats.slice(0,8).map((p,i)=><div className="rank-row" key={p.name} tabIndex={0} title={`${titleCase(p.name)} · rerata ${fmtValue(p.value,1)}${indicator.unit} · ${p.count} kabupaten/kota`}><small>{String(i+1).padStart(2,'0')}</small><b>{titleCase(p.name)}</b><span>{p.count} kab/kota</span><strong>{fmtValue(p.value,1)}{indicator.unit}</strong><div className="rank-track"><i style={{width:`${p.value/indicator.max*100}%`}}/></div></div>)}</div></Panel><Panel eyebrow="KABUPATEN DAN KOTA" title="Rerata menurut jenis wilayah"><Bars rows={['Kabupaten','Kota'].map((name,i)=>({name,value:average(rows.filter(r=>r.tipe_wilayah===name),indicator.key),count:rows.filter(r=>r.tipe_wilayah===name).length,color:i===0?ORANGE:BLUE}))} max={indicator.max} unit={indicator.unit}/><p className="method-note">Perbandingan ini menunjukkan perbedaan angka, bukan penyebabnya.</p></Panel></div></>
}

function ClusterProfiles({ rows }: { rows: District[] }) {
  const indicators=[
    {key:'unemployment_rate_tpt' as const,label:'Pengangguran terbuka (TPT)',unit:'%',digits:1},
    {key:'log_pdrb' as const,label:'PDRB harga konstan (log)',unit:'log',digits:2},
    {key:'life_expectancy' as const,label:'Umur harapan hidup',unit:'tahun',digits:1},
    {key:'expenditure_per_capita' as const,label:'Pengeluaran per kapita',unit:'ribu rupiah/orang/tahun',digits:0},
    {key:'avg_school_years' as const,label:'Rata-rata lama sekolah',unit:'tahun',digits:1},
    {key:'clean_water_access_pct' as const,label:'Akses air minum layak',unit:'%',digits:1},
    {key:'sanitation_access_pct' as const,label:'Akses sanitasi layak',unit:'%',digits:1},
  ]
  const clusters=[...new Set(rows.map(row=>row.cluster_id))].sort((a,b)=>a-b).map(id=>rows.filter(row=>row.cluster_id===id))
  const national=Object.fromEntries(indicators.map(indicator=>[indicator.key,average(rows,indicator.key)])) as Record<string,number>
  const deviations=Object.fromEntries(indicators.map(indicator=>[indicator.key,standardDeviation(rows,indicator.key,national[indicator.key])])) as Record<string,number>
  const axisTicks=[-3,-2,-1,0,1,2,3]
  return <>
    <div className="summary-strip"><div><span>Hasil pengelompokan</span><b>{clusters.length} kelompok wilayah</b><small>Daerah dalam satu kelompok memiliki profil yang mirip.</small></div><div><span>Indikator pembanding</span><b>7 kondisi sosial-ekonomi</b><small>Pendidikan, ekonomi, kesehatan, layanan dasar, dan pekerjaan.</small></div><div><span>Cara membaca</span><b>Bandingkan dengan garis 0</b><small>Bar menunjukkan jarak dari rerata seluruh daerah dalam satuan simpangan baku.</small></div></div>
    <div className="cluster-grid chart-enter">{clusters.map((group,index)=>{const groupId=group[0].cluster_id;const name=group[0].cluster_name.replace(/^Klaster \d+: /,'');const clusterP0=average(group,'poverty_rate_p0');return <article className="cluster-card" key={groupId} style={{'--cluster-color':clusterColors[groupId]} as React.CSSProperties}>
      <header><div><span className="cluster-dot"/><b>Kelompok {groupId+1}</b><small>{group.length} kabupaten/kota</small></div><strong>{percent(clusterP0)}<small>rerata P0</small></strong></header>
      <h3>{name}</h3>
      <div className="profile-axis" aria-hidden="true">{axisTicks.map(tick=><span key={tick} style={{left:`${((tick+3)/6)*100}%`}}>{tick===0?'0':`${tick>0?'+':''}${tick}σ`}</span>)}</div>
      <div className="profile-bars">{indicators.map(indicator=>{const value=average(group,indicator.key);const baseline=national[indicator.key];const z=(value-baseline)/deviations[indicator.key];const clipped=Math.max(-3,Math.min(3,z));const edge=((clipped+3)/6)*100;const left=Math.min(50,edge);const width=Math.max(Math.abs(edge-50),.6);const shown=fmtValue(value,indicator.digits);const baseShown=fmtValue(baseline,indicator.digits);const zShown=`${z>=0?'+':''}${fmtValue(z,1)}σ`;const clippedNote=Math.abs(z)>3?'; bar mencapai batas skala ±3σ':'';const difference=value-baseline;const differenceShown=`${difference>=0?'+':''}${fmtValue(difference,indicator.digits)} ${indicator.unit}`;return <div className="profile-line" key={indicator.key} tabIndex={0} role="img" aria-label={`${indicator.label}: rerata kelompok ${shown} ${indicator.unit}; rerata semua daerah ${baseShown} ${indicator.unit}; selisih ${zShown}${clippedNote}`} data-tooltip={`${indicator.label} · Kelompok ${shown} ${indicator.unit} · Semua daerah ${baseShown} ${indicator.unit} · Selisih ${differenceShown} (${zShown}) · ${group.length} daerah${clippedNote}`}>
        <span title={indicator.label}>{indicator.label}</span><div className="profile-track"><i className="profile-zero"/><i className={`profile-value ${z < -3 ? 'clipped-left' : z > 3 ? 'clipped-right' : ''}`} style={{left:`${left}%`,width:`${width}%`}}/></div><b>{zShown}</b>
      </div>})}</div>
      <div className="cluster-caption">Kiri berarti di bawah rerata semua daerah; kanan berarti di atas. Arah bar tidak selalu berarti kondisi lebih baik atau lebih buruk.</div>
    </article>})}</div>
    <Panel eyebrow="P0 PER KELOMPOK" title="Angka kemiskinan tetap beragam di dalam tiap kelompok" description="Setiap titik menunjukkan satu kabupaten/kota; garis menunjukkan median P0. P0 digunakan untuk membandingkan kelompok, bukan untuk membentuknya."><StripPlot rows={rows} groupKey="cluster_id"/></Panel>
  </>
}
function StripPlot({ rows, groupKey }: { rows: District[]; groupKey: 'cluster_id' }) {
  const groups=[...new Set(rows.map(r=>r[groupKey]))].sort((a,b)=>a-b), W=950,H=groups.length*100+66,L=78,R=25, top=48, max=45
  return <div className="svg-scroll"><svg viewBox={`0 0 ${W} ${H}`} className="strip-svg" role="img" aria-label="Sebaran P0 pada setiap kelompok wilayah">{[0,10,20,30,40].map(t=><g key={t}><line x1={L+t/max*(W-L-R)} x2={L+t/max*(W-L-R)} y1={top-18} y2={H-42} className="chart-grid"/><text x={L+t/max*(W-L-R)} y={H-23} textAnchor="middle" className="svg-label">{t}%</text></g>)}{groups.map((g,gi)=>{const subset=rows.filter(r=>r[groupKey]===g), med=median(subset.map(r=>r.poverty_rate_p0)), yy=top+gi*94;return <g key={g}><text x={L-12} y={yy+4} textAnchor="end" className="svg-label strip-group-label">{`Kelompok ${g+1}`}</text><line x1={L} x2={W-R} y1={yy} y2={yy} className="chart-grid"/>{subset.map((d,i)=><circle key={`${d.kab_kota}-${i}`} className="strip-point" cx={L+d.poverty_rate_p0/max*(W-L-R)} cy={yy+((i%7)-3)*3} r="3.8" fill={clusterColors[g]} opacity=".58" tabIndex={0} role="img" aria-label={`${d.kab_kota}, ${titleCase(d.provinsi)}: P0 ${percent(d.poverty_rate_p0)}`}><title>{`${d.kab_kota}, ${titleCase(d.provinsi)} · P0 ${percent(d.poverty_rate_p0)}`}</title></circle>)}<line x1={L+med/max*(W-L-R)} x2={L+med/max*(W-L-R)} y1={yy-20} y2={yy+20} stroke={NAVY} strokeWidth="2"/><text x={L+med/max*(W-L-R)} y={yy-25} textAnchor="middle" className="svg-label">Median {percent(med)}</text></g>})}<text x={(L+W-R)/2} y={H-3} textAnchor="middle" className="svg-label strip-axis-title">Persentase penduduk miskin (P0)</text></svg></div>
}

function Screening({ rows }: { rows: District[] }) {
  const medP=median(rows.map(r=>r.poverty_rate_p0)), medV=0.272, W=800,H=390,L=65,R=24,T=20,B=55, x=(v:number)=>L+v/45*(W-L-R), y=(v:number)=>T+(1-v)*(H-T-B)
  const urgent=rows.filter(r=>r.poverty_rate_p0>=medP&&r.vulnerability_score>=medV).sort((a,b)=>b.vulnerability_score-a.vulnerability_score)
  const top=[...urgent,...rows.filter(r=>!urgent.includes(r)).sort((a,b)=>b.vulnerability_score-a.vulnerability_score)].slice(0,10)
  const [selected,setSelected]=useState<District|undefined>(top[0])
  useEffect(()=>setSelected(top[0]),[rows])
  return <><div className="screening-grid chart-enter"><Panel eyebrow="SKRINING · 514 KABUPATEN/KOTA" title="P0 lebih tinggi dan indikator dasar tertinggal" description="Titik di kanan-atas melampaui median data pada P0 dan skor kerentanan. Pilih titik untuk melihat kondisi daerah. Batas ini membantu menyaring wilayah untuk ditelaah."><div className="svg-scroll"><svg viewBox={`0 0 ${W} ${H}`} className="screen-svg" role="img" aria-label="Sebaran P0 dan indeks kerentanan struktural"><rect x={x(medP)} y={T} width={W-R-x(medP)} height={y(medV)-T} fill="#FDF0E9"/><line x1={x(medP)} x2={x(medP)} y1={T} y2={H-B} stroke="#64748B" strokeDasharray="5 5"/><line x1={L} x2={W-R} y1={y(medV)} y2={y(medV)} stroke="#64748B" strokeDasharray="5 5"/>{[0,10,20,30,40].map(t=><g key={t}><line x1={x(t)} x2={x(t)} y1={T} y2={H-B} className="chart-grid"/><text x={x(t)} y={H-B+20} textAnchor="middle" className="svg-label">{t}%</text></g>)}{[0,.25,.5,.75,1].map(t=><g key={t}><line x1={L} x2={W-R} y1={y(t)} y2={y(t)} className="chart-grid"/><text x={L-9} y={y(t)+4} textAnchor="end" className="svg-label">{fmtValue(t,2)}</text></g>)}{rows.map(d=>{const urgentPoint=d.poverty_rate_p0>=medP&&d.vulnerability_score>=medV;return <circle key={`${d.provinsi}-${d.kab_kota}`} cx={x(d.poverty_rate_p0)} cy={y(d.vulnerability_score)} r={urgentPoint?4:3} fill={clusterColors[d.cluster_id]??GRAY} opacity={urgentPoint?.78:.42} tabIndex={0} role="button" aria-label={`${d.kab_kota}: P0 ${percent(d.poverty_rate_p0)}, indeks ${fmt2.format(d.vulnerability_score)}`} onClick={()=>setSelected(d)} onKeyDown={e=>{if(e.key==='Enter')setSelected(d)}}><title>{`${d.kab_kota}, ${titleCase(d.provinsi)} · P0 ${percent(d.poverty_rate_p0)} · V ${fmt2.format(d.vulnerability_score)}`}</title></circle>})}<text x={(L+W-R)/2} y={H-7} textAnchor="middle" className="svg-label">Penduduk miskin (P0, %)</text><text transform={`translate(16 ${(T+H-B)/2}) rotate(-90)`} textAnchor="middle" className="svg-label">Indeks kerentanan struktural (0–1)</text></svg></div><div className="chart-legend">{[0,1,2,3].map(i=><span key={i}><i style={{background:clusterColors[i]}}/>Kelompok {i+1}</span>)}</div></Panel><SelectedDistrict row={selected??top[0]} /></div><div className="insight-strip"><b>HASIL</b><span>{urgent.length} kabupaten/kota berada di atas median data pada kedua ukuran. Gunakan daftar ini sebagai titik awal penelaahan bersama daerah.</span></div><Panel eyebrow="DAFTAR UNTUK DITELAAH" title="10 wilayah dengan skor kerentanan tertinggi" description="Periksa indikator dan konteks lokal sebelum merancang tindak lanjut."><DistrictTable rows={top}/></Panel></>
}

function SelectedDistrict({row}:{row?:District}) { if(!row)return null; return <aside className="province-card selected-card"><span className="eyebrow">RINGKASAN DAERAH</span><h3>{row.kab_kota}</h3><small>{titleCase(row.provinsi)}</small><div className="selected-stats"><div><span>P0</span><b>{percent(row.poverty_rate_p0)}</b></div><div><span>Skor kerentanan¹</span><b>{fmt2.format(row.vulnerability_score)}</b></div></div>{[['Lama sekolah',`${fmtValue(row.avg_school_years,1)} tahun`],['Pengeluaran',`Rp ${idr.format(row.expenditure_per_capita)} ribu/orang/tahun`],['Sanitasi layak',percent(row.sanitation_access_pct)],['Air minum layak',percent(row.clean_water_access_pct)],['TPT',percent(row.unemployment_rate_tpt)]].map(([k,v])=><div className="detail-line" key={k}><span>{k}</span><b>{v}</b></div>)}<p>¹ Skor relatif terhadap daerah lain; bukan peluang kemiskinan. Gunakan sebagai bahan telaah, bukan dasar alokasi tunggal.</p></aside> }

function DistrictTable({rows}:{rows:District[]}) { return <div className="table-wrap"><table><thead><tr><th>Wilayah</th><th>Provinsi</th><th>P0</th><th>Indeks relatif</th><th>Sanitasi</th><th>Air minum</th><th>RLS</th></tr></thead><tbody>{rows.map(r=><tr key={`${r.provinsi}-${r.kab_kota}`}><td>{r.tipe_wilayah} {r.kab_kota}</td><td>{titleCase(r.provinsi)}</td><td>{percent(r.poverty_rate_p0)}</td><td>{fmt2.format(r.vulnerability_score)}</td><td>{percent(r.sanitation_access_pct)}</td><td>{percent(r.clean_water_access_pct)}</td><td>{fmtValue(r.avg_school_years,2)} th</td></tr>)}</tbody></table></div> }

const auditMetrics = [
  {key:'poverty_rate_p0' as const,label:'Penduduk miskin (P0)',unit:'%',clusters:'Tidak',screening:'Ya'},
  {key:'avg_school_years' as const,label:'Rata-rata lama sekolah',unit:'Tahun',clusters:'Ya',screening:'Ya'},
  {key:'expenditure_per_capita' as const,label:'Pengeluaran per kapita',unit:'Ribu rupiah/orang/tahun',clusters:'Ya',screening:'Konteks'},
  {key:'human_dev_index' as const,label:'Indeks Pembangunan Manusia',unit:'Indeks',clusters:'Tidak',screening:'Tidak'},
  {key:'life_expectancy' as const,label:'Umur harapan hidup',unit:'Tahun',clusters:'Ya',screening:'Ya'},
  {key:'sanitation_access_pct' as const,label:'Akses sanitasi layak',unit:'%',clusters:'Ya',screening:'Ya'},
  {key:'clean_water_access_pct' as const,label:'Akses air minum layak',unit:'%',clusters:'Ya',screening:'Ya'},
  {key:'unemployment_rate_tpt' as const,label:'Pengangguran terbuka (TPT)',unit:'%',clusters:'Ya',screening:'Ya'},
  {key:'labor_participation_tpak' as const,label:'Partisipasi angkatan kerja (TPAK)',unit:'%',clusters:'Tidak',screening:'Konteks'},
  {key:'log_pdrb' as const,label:'Log PDRB harga konstan',unit:'ln(Rp juta)',clusters:'Ya',screening:'Tidak'},
]
function Methodology({rows}:{rows:District[]}) {
  const [field,setField]=useState<keyof District>('poverty_rate_p0'),[search,setSearch]=useState('')
  const meta=auditMetrics.find(item=>item.key===field) ?? auditMetrics[0]
  const values=rows.map(row=>Number(row[field])).filter(Number.isFinite)
  const q=quartiles(values), iqr=q.q3-q.q1
  const lowFence=q.q1-1.5*iqr, highFence=q.q3+1.5*iqr
  const min=Math.min(...values), max=Math.max(...values)
  const whiskerLow=Math.min(...values.filter(value=>value>=lowFence)), whiskerHigh=Math.max(...values.filter(value=>value<=highFence))
  const outliers=rows.filter(row=>Number(row[field])<lowFence||Number(row[field])>highFence)
    .sort((a,b)=>Math.abs(Number(b[field])-q.median)-Math.abs(Number(a[field])-q.median))
  const samples=['Kota Surakarta','Cilacap','Banyumas'].map(name=>rows.find(row=>row.kab_kota===name)).filter((row):row is District=>Boolean(row))
  const zeroCases=[
    {label:'Sanitasi layak',field:'sanitation_access_pct' as const},
    {label:'Air minum layak',field:'clean_water_access_pct' as const},
    {label:'Pengangguran terbuka',field:'unemployment_rate_tpt' as const},
  ].map(item=>({...item,rows:rows.filter(row=>row[item.field]===0)}))
  const searchRows=auditMetrics.filter(item=>item.label.toLowerCase().includes(search.toLowerCase()))
  const position=(value:number)=>`${Math.max(0,Math.min(100,(value-min)/(max-min||1)*100))}%`
  const shortList=outliers.slice(0,6)
  return <>
    <div className="method-banner"><span>i</span><div><h2>Ringkasan data untuk bahan telaah</h2><p>Gunakan gambaran ini untuk melihat daerah yang perlu diperhatikan, lalu cocokkan dengan kondisi terbaru dan informasi dari pemerintah daerah.</p></div></div>
    <div className="audit-kpis chart-enter">
      <div><small>CAKUPAN</small><b>{rows.length} daerah</b><p>Kabupaten/kota yang tercatat.</p></div>
      <div><small>PROVINSI</small><b>{new Set(rows.map(row=>row.provinsi)).size}</b><p>Provinsi yang terwakili dalam data.</p></div>
      <div><small>TAHUN DATA</small><b>2021</b><p>Sumber: data BPS yang digunakan proyek.</p></div>
      <div><small>PROFIL DAERAH</small><b>{new Set(rows.map(row=>row.cluster_id)).size} kelompok</b><p>Dibentuk dari kemiripan kondisi sosial-ekonomi.</p></div>
    </div>
    <div className="overview-grid stakeholder-grid">
      <Panel eyebrow="APA ARTINYA" title="Kelompok membantu membandingkan kondisi daerah" description="Daerah dalam kelompok yang sama memiliki profil indikator yang mirip. Kelompok bukan peringkat, label miskin, atau rekomendasi bantuan otomatis.">
        <div className="stakeholder-points"><div><b>Untuk menyusun telaah</b><p>Lihat indikator yang paling tertinggal di suatu kelompok dan tentukan daerah yang perlu ditinjau lebih lanjut.</p></div><div><b>Untuk membaca P0</b><p>Angka P0 dipakai untuk membandingkan hasil kelompok, bukan untuk membentuk kelompoknya.</p></div><div><b>Sebelum mengambil keputusan</b><p>Cocokkan temuan dengan data terbaru, kondisi lapangan, dan program yang sudah berjalan.</p></div></div>
      </Panel>
      <Panel eyebrow="CONTOH ANGKA P0" title="Tiga daerah, tiga nilai berbeda" description="Contoh ini menunjukkan cara membaca angka pada berkas data.">
        <div className="sample-list">{samples.map(row=><div key={row.kab_kota}><b>{row.kab_kota}</b><span>{titleCase(row.provinsi)}</span><strong>{percent(row.poverty_rate_p0)}</strong></div>)}</div>
        <small className="method-note">P0 adalah persentase penduduk yang berada di bawah garis kemiskinan.</small>
      </Panel>
    </div>
    <Panel eyebrow="SEBARAN INDIKATOR · BOXPLOT" title={`Sebaran ${meta.label.toLowerCase()} di seluruh daerah`} description="Garis di tengah kotak adalah median; kotak memuat separuh daerah yang berada di sekitar nilai tengah. Titik di luar rentang ditandai untuk diperiksa, bukan otomatis dianggap salah.">
      <div className="method-controls"><label>Indikator<select value={field} onChange={event=>setField(event.target.value as keyof District)}>{auditMetrics.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label></div>
      <div className="tukey-chart"><div className="tukey-axis"><span>{fmtValue(min,1)} {meta.unit}</span><span>{fmtValue(q.median,1)} · median</span><span>{fmtValue(max,1)} {meta.unit}</span></div>
        <div className="tukey-plot" role="img" aria-label={`Boxplot ${meta.label}: median ${fmtValue(q.median,1)} ${meta.unit}, rentang ${fmtValue(q.q1,1)} sampai ${fmtValue(q.q3,1)} ${meta.unit}, ${outliers.length} nilai ekstrem`}>
          <div className="whisker" style={{left:position(whiskerLow),width:`${Math.max(0,Number(position(whiskerHigh).replace('%',''))-Number(position(whiskerLow).replace('%','')))}%`}}/>
          <div className="box" style={{left:position(q.q1),width:`${Math.max(.5,Number(position(q.q3).replace('%',''))-Number(position(q.q1).replace('%','')))}%`}}/>
          <div className="median-line" style={{left:position(q.median)}}/>
          <span className="quartile-label q1" style={{left:position(q.q1)}}>Q1 {fmtValue(q.q1,1)}</span><span className="quartile-label q3" style={{left:position(q.q3)}}>Q3 {fmtValue(q.q3,1)}</span><span className="quartile-label med-label" style={{left:position(q.median)}}>Median {fmtValue(q.median,1)}</span>
          {outliers.map((row,index)=><i className="outlier-dot" key={`${row.kab_kota}-${index}`} title={`${row.kab_kota}, ${titleCase(row.provinsi)}: ${fmtValue(Number(row[field]),2)} ${meta.unit}`} style={{left:position(Number(row[field])),top:`${34+(index%6)*7}%`}}/>)}
        </div>
        <div className="tukey-stats"><span>Separuh daerah berada di <b>{fmtValue(q.q1,1)}–{fmtValue(q.q3,1)} {meta.unit}</b></span><span>Nilai tengah <b>{fmtValue(q.median,1)} {meta.unit}</b></span><span>Ditandai untuk ditinjau <b>{outliers.length} daerah</b></span></div>
      </div>
      {shortList.length>0&&<div className="outlier-list">{shortList.map(row=><div key={`${row.provinsi}-${row.kab_kota}`}><b>{row.kab_kota}</b><span>{titleCase(row.provinsi)}</span><strong>{fmtValue(Number(row[field]),2)} {meta.unit}</strong></div>)}</div>}
    </Panel>    <div className="overview-grid stakeholder-grid">
      <Panel eyebrow="KUALITAS DATA" title="Nilai nol tetap dicatat" description="Nilai 0 pada berkas tidak diubah menjadi data kosong. Periksa konteksnya sebelum menafsirkan angka tersebut.">
        <div className="zero-list">{zeroCases.map(item=><div key={item.field}><b>{item.label}</b><strong>{item.rows.length} daerah</strong><span>{item.rows.map(row=>row.kab_kota).join(', ')||'Tidak ada nilai 0'}</span></div>)}</div>
      </Panel>
      <Panel eyebrow="CARA PENGELOMPOKAN" title="Tujuh indikator membentuk profil daerah" description="Pendidikan, pengeluaran, kesehatan, sanitasi, air minum, pengangguran terbuka, dan PDRB dipakai untuk mencari daerah dengan kondisi serupa.">
        <div className="stakeholder-note"><b>P0 tidak ikut membentuk kelompok.</b><p>Pemisahan ini membuat angka kemiskinan tetap bisa dipakai sebagai pembanding yang berdiri sendiri. Hasil pengelompokan bersifat deskriptif dan tidak menjelaskan penyebab kemiskinan.</p></div>
      </Panel>
    </div>
    <Panel eyebrow="KAMUS DATA" title="Arti indikator dalam dashboard" description="Tabel ini menjelaskan satuan dan peran tiap indikator. Unduh data untuk menelusuri angka per kabupaten/kota.">
      <div className="dictionary-head"><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Cari nama indikator…"/><a className="download-btn" href="/data/poverty_clusters.csv" download>Unduh data (CSV)</a></div>
      <div className="table-wrap"><table><thead><tr><th>Indikator</th><th>Satuan</th><th>Dipakai untuk profil</th><th>Dipakai untuk penapisan</th></tr></thead><tbody>{searchRows.map(item=><tr key={item.key}><td>{item.label}</td><td>{item.unit}</td><td>{item.clusters==='Ya'?'Ya':item.clusters==='Tidak'?'Tidak':'Sebagai konteks'}</td><td>{item.screening==='Ya'?'Ya':item.screening==='Tidak'?'Tidak':'Sebagai konteks'}</td></tr>)}</tbody></table></div>
    </Panel>
    <div className="stakeholder-caveat"><b>Catatan penggunaan</b><p>Data menggambarkan kondisi tahun 2021. Gunakan sebagai titik awal diskusi dan penentuan wilayah yang perlu ditelaah, bukan satu-satunya dasar untuk menetapkan penerima atau anggaran.</p></div>
  </>
}
export function App() {
  const [districts,setDistricts]=useState<District[]>([]),[error,setError]=useState(''),[page,setPage]=useState<PageId>('overview'),[province,setProvince]=useState('all'),[mapMetric,setMapMetric]=useState('poverty_rate_p0')
  useEffect(()=>{fetch('/data/poverty_clusters.csv').then(r=>{if(!r.ok)throw new Error('CSV processed tidak dapat dimuat');return r.text()}).then(text=>setDistricts(parseDistricts(text))).catch(e=>setError(e.message))},[])
  const provinces=[...new Set(districts.map(r=>r.provinsi))]
  const filtered=useMemo(()=>province==='all'?districts:districts.filter(r=>r.provinsi===province),[districts,province])
  const current=navItems.find(item=>item.id===page)!
  return <div className="dashboard-shell"><SideBar page={page} setPage={setPage} count={districts.length}/><main className="main-content" id="top"><Header page={current} count={districts.length}/><div className="content-area">{error?<div className="error">Data belum termuat: {error}</div>:!districts.length?<div className="loading">Memuat data processed…</div>:<>{page==='overview'&&<Overview rows={filtered} allRows={districts} province={province} setProvince={setProvince}/ >}{page==='map'&&<ProvinceMap rows={districts} indicator={mapIndicators.find(x=>x.key===mapMetric)!} onIndicatorChange={setMapMetric}/ >}{page==='clusters'&&<ClusterProfiles rows={districts}/ >}{page==='screening'&&<Screening rows={districts}/ >}{page==='method'&&<Methodology rows={districts}/ >}<footer className="global-footer"><span>PovertyWatch SDGs · Sistem pemetaan klaster dan analisis risiko kemiskinan daerah Indonesia</span><span>{districts.length} kabupaten/kota · BPS 2021</span></footer></>}</div></main></div>
}
