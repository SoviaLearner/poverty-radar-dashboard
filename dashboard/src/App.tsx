import { useEffect, useMemo, useState } from 'react'

type District = {
  provinsi: string; kab_kota: string; region_pulau: string; poverty_rate_p0: number
  avg_school_years: number; sanitation_access_pct: number; clean_water_access_pct: number
  unemployment_rate_tpt: number; labor_participation_tpak: number; cluster_name: string
  vulnerability_quadrant: string
}

const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })
const fmt2 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const pct = (n: number) => `${fmt.format(n)}%`
const parseCsvRow = (line: string) => {
  const cells: string[] = []
  let cell = '', quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++ }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { cells.push(cell); cell = '' }
    else cell += char
  }
  cells.push(cell)
  return cells
}

function Panel({ eyebrow, title, description, children, className = '' }: { eyebrow: string; title: string; description: string; children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div></div>{children}</section>
}

function BarChart({ rows, value, label, unit, highlight, scaleMax }: { rows: { name: string; value: number }[]; value: (n: number) => string; label: string; unit: string; highlight?: string; scaleMax?: number }) {
  const max = scaleMax ?? Math.ceil(Math.max(...rows.map(r => r.value)) / 10) * 10
  const ticks = [0, .25, .5, .75, 1].map(t => max * t)
  return <div className="bars" role="list" aria-label={label}><div className="bar-axis"><span className="axis-caption">0{unit}</span><div>{ticks.map((tick, i) => <span key={i}>{fmt.format(tick)}</span>)}</div></div>{rows.map(row => <div className={`bar-row ${row.name === highlight ? 'highlight' : ''}`} key={row.name} role="listitem"><span className="bar-name">{row.name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, row.value / max * 100))}%` }} title={`${row.name}: ${value(row.value)}${unit}`} /></div><span className="bar-value">{value(row.value)}{unit}</span></div>)}</div>
}

function Scatter({ rows }: { rows: District[] }) {
  const W = 720, H = 330, L = 58, R = 18, T = 18, B = 48
  const xMax = 100, yMax = 45
  const x = (n: number) => L + n / xMax * (W - L - R)
  const y = (n: number) => T + (yMax - n) / yMax * (H - T - B)
  const focus = rows.filter(r => r.poverty_rate_p0 >= 30 && r.labor_participation_tpak >= 85).sort((a,b)=>b.poverty_rate_p0-a.poverty_rate_p0)
  return <div className="chart-scroll"><svg className="scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scatter plot hubungan partisipasi angkatan kerja dan kemiskinan; setiap titik mewakili satu kabupaten atau kota.">
    {[0, 10, 20, 30, 40].map(t => <g key={t}><line x1={L} x2={W-R} y1={y(t)} y2={y(t)} className="grid-line"/><text x={L-10} y={y(t)+4} textAnchor="end" className="axis-label">{t}%</text></g>)}
    {[0, 20, 40, 60, 80, 100].map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={T} y2={H-B} className="grid-line vertical"/><text x={x(t)} y={H-B+20} textAnchor="middle" className="axis-label">{t}%</text></g>)}
    <line x1={L} x2={W-R} y1={H-B} y2={H-B} className="axis-line"/><line x1={L} x2={L} y1={T} y2={H-B} className="axis-line"/>
    {rows.map(d => { const isFocus = focus.includes(d); return <circle key={`${d.provinsi}-${d.kab_kota}`} cx={x(d.labor_participation_tpak)} cy={y(d.poverty_rate_p0)} r={isFocus ? 4.5 : 2.8} fill={isFocus ? '#D55E00' : '#0072B2'} opacity={isFocus ? .9 : .35}><title>{`${d.kab_kota}, ${d.provinsi} · TPAK ${pct(d.labor_participation_tpak)} · P0 ${pct(d.poverty_rate_p0)}`}</title></circle> })}
    {focus.slice(0, 5).map(d => <text key={`label-${d.kab_kota}`} x={x(d.labor_participation_tpak)-6} y={y(d.poverty_rate_p0)-8} textAnchor="end" className="point-label">{d.kab_kota}</text>)}
    <text x={(L+W-R)/2} y={H-6} textAnchor="middle" className="axis-title">Partisipasi angkatan kerja (TPAK, %)</text><text transform={`translate(15 ${(T+H-B)/2}) rotate(-90)`} textAnchor="middle" className="axis-title">Penduduk miskin (P0, %)</text>
  </svg></div>
}

export function App() {
  const [districts, setDistricts] = useState<District[]>([])
  const [error, setError] = useState('')
  const [island, setIsland] = useState('Semua pulau')
  const [query, setQuery] = useState('')
  useEffect(() => { fetch('/data/poverty_clusters.csv').then(r => { if (!r.ok) throw new Error('CSV tidak dapat dimuat'); return r.text() }).then(csv => {
    const lines = csv.trim().split(/\r?\n/); const headers = parseCsvRow(lines[0])
    const data = lines.slice(1).map(line => { const cols = parseCsvRow(line); const row: Record<string, string> = {}; headers.forEach((h, i) => row[h] = cols[i] ?? ''); return row }).map(r => ({ provinsi:r.provinsi, kab_kota:r.kab_kota, region_pulau:r.region_pulau, poverty_rate_p0:Number(r.poverty_rate_p0), avg_school_years:Number(r.avg_school_years), sanitation_access_pct:Number(r.sanitation_access_pct), clean_water_access_pct:Number(r.clean_water_access_pct), unemployment_rate_tpt:Number(r.unemployment_rate_tpt), labor_participation_tpak:Number(r.labor_participation_tpak), cluster_name:r.cluster_name, vulnerability_quadrant:r.vulnerability_quadrant }))
    setDistricts(data)
  }).catch(e => setError(e.message)) }, [])
  const filtered = useMemo(() => districts.filter(d => (island === 'Semua pulau' || d.region_pulau === island) && (!query || `${d.kab_kota} ${d.provinsi}`.toLowerCase().includes(query.toLowerCase()))), [districts, island, query])
  const sorted = useMemo(() => [...filtered].sort((a,b) => b.poverty_rate_p0-a.poverty_rate_p0), [filtered])
  const acute = filtered.filter(d => d.poverty_rate_p0 >= 20)
  const mean = (key: keyof District, rows = filtered) => rows.length ? rows.reduce((s,d) => s + Number(d[key]), 0)/rows.length : 0
  const byIsland = useMemo(() => [...new Set(districts.map(d => d.region_pulau))].map(name => ({ name, value: mean('poverty_rate_p0', districts.filter(d => d.region_pulau === name)) })).sort((a,b) => a.value-b.value), [districts])
  const nationalSorted = [...districts].sort((a,b) => a.poverty_rate_p0-b.poverty_rate_p0)
  const lowest = nationalSorted[0], highest = nationalSorted.at(-1)
  const workingPoor = [...filtered].sort((a,b) => (b.poverty_rate_p0 - b.labor_participation_tpak/10) - (a.poverty_rate_p0 - a.labor_participation_tpak/10)).slice(0,5)
  const tiers = [{name:'Di bawah 10%', value:filtered.filter(d=>d.poverty_rate_p0<10).length},{name:'10–19,9%',value:filtered.filter(d=>d.poverty_rate_p0>=10&&d.poverty_rate_p0<20).length},{name:'20–29,9%',value:filtered.filter(d=>d.poverty_rate_p0>=20&&d.poverty_rate_p0<30).length},{name:'30% ke atas',value:filtered.filter(d=>d.poverty_rate_p0>=30).length}]

  return <div className="app"><header className="topbar"><a className="brand" href="#top"><span className="brand-mark">P</span><span><b>PovertyRadar</b><small>INDONESIA · BPS 2021</small></span></a><div className="top-meta">Cerita data kemiskinan daerah <span className="data-badge">{districts.length || '…'} kabupaten/kota</span></div></header>
    <main id="top"><section className="hero"><div className="hero-copy"><span className="eyebrow">PETA KETIMPANGAN · 01 / INDONESIA</span><h1>Tempat tinggal mengubah peluang keluar dari kemiskinan.</h1><p>Di antara 514 kabupaten/kota, tingkat kemiskinan tertinggi jauh melampaui titik terendah. Data BPS 2021 membantu menunjukkan di mana layanan dasar dan dukungan ekonomi perlu diprioritaskan.</p><div className="hero-note"><span className="note-dot"/> Data terpilah per kabupaten/kota · BPS Susenas & Sakernas 2021</div></div><div className="hero-stat"><span>Rentang P0 daerah</span><strong>{lowest && highest ? `${fmt1(highest.poverty_rate_p0 / lowest.poverty_rate_p0)}×` : '—'}</strong><p>perbandingan {lowest?.kab_kota ?? '—'} ({lowest ? pct(lowest.poverty_rate_p0) : '—'}) dengan {highest?.kab_kota ?? '—'} ({highest ? pct(highest.poverty_rate_p0) : '—'})</p></div></section>
    {error ? <div className="error">Data belum termuat: {error}</div> : !districts.length ? <div className="loading">Memuat data terpilah…</div> : <>
    <section className="filter-row"><div><span className="eyebrow">JELAJAHI DATA</span><h2>Bandingkan daerah</h2></div><div className="filters"><label>Pulau<select value={island} onChange={e=>setIsland(e.target.value)}><option>Semua pulau</option>{[...new Set(districts.map(d=>d.region_pulau))].sort().map(p=><option key={p}>{p}</option>)}</select></label><label>Cari wilayah<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kabupaten atau provinsi"/></label></div></section>
    <section className="kpi-grid"><article className="kpi"><span>Wilayah dianalisis</span><strong>{fmt.format(filtered.length)}</strong><small>dari {districts.length} kabupaten/kota</small></article><article className="kpi"><span>Rata-rata P0</span><strong>{pct(mean('poverty_rate_p0'))}</strong><small>tertimbang sama per wilayah</small></article><article className="kpi alert-kpi"><span>Wilayah P0 ≥ 20%</span><strong>{fmt.format(acute.length)}</strong><small>{filtered.length ? pct(acute.length/filtered.length*100) : '0%'} dari pilihan saat ini</small></article><article className="kpi"><span>Akses sanitasi rata-rata</span><strong>{pct(mean('sanitation_access_pct'))}</strong><small>persentase rumah tangga</small></article></section>
    <div className="charts-grid"><Panel eyebrow="PERBANDINGAN WILAYAH" title="Maluku & Papua mencatat rata-rata P0 tertinggi" description="Rata-rata persentase penduduk miskin per gugus pulau. Tiap kabupaten/kota berbobot sama; pilih pulau di atas untuk menyaring tabel dan indikator."><div className="chart-wrap"><BarChart rows={byIsland} value={fmt.format} label="Rata-rata kemiskinan menurut gugus pulau" unit="%" scaleMax={45} highlight={byIsland.at(-1)?.name}/><div className="chart-foot">P0 · persentase penduduk miskin · skala dimulai dari 0</div></div></Panel>
    <Panel eyebrow="DISTRIBUSI" title="Mayoritas wilayah memiliki P0 di bawah 20%" description="Jumlah kabupaten/kota menurut tingkat P0. Kategori saling lepas: &lt;10%, 10–&lt;20%, 20–&lt;30%, dan ≥30%."><div className="chart-wrap"><BarChart rows={tiers} value={fmt.format} label="Jumlah wilayah pada tiap kategori kemiskinan" unit=" wilayah" scaleMax={districts.length} highlight={tiers.reduce((a,b)=>a.value>b.value?a:b).name}/><div className="chart-foot">Jumlah kabupaten/kota · sumbu dimulai dari nol</div></div></Panel></div>
    <Panel eyebrow="KETENAGAKERJAAN & KEMISKINAN" title="TPAK berkorelasi positif dengan kemiskinan di seluruh Indonesia" description="Pada 514 daerah, korelasi TPAK–P0 adalah r = +0,462. Titik jingga menandai P0 ≥ 30% dan TPAK ≥ 85%; hubungan ini bersifat asosiasional, bukan bukti sebab-akibat."><Scatter rows={filtered}/><div className="chart-legend"><span><i className="legend-dot blue"/>Wilayah lain</span><span><i className="legend-dot red"/>P0 ≥ 30% dan TPAK ≥ 85%</span><span className="legend-hint">Arahkan kursor ke titik untuk detail wilayah</span></div></Panel>
    <div className="charts-grid"><Panel eyebrow="PRIORITAS DAERAH" title="Lima kabupaten/kota dengan P0 tertinggi" description="Peringkat memakai nilai P0 kabupaten/kota, bukan agregat provinsi. Gunakan daftar ini untuk menemukan lokasi yang perlu ditelaah lebih lanjut."><div className="chart-wrap"><BarChart rows={[...sorted].reverse().slice(0,5).map(d=>({name:d.kab_kota,value:d.poverty_rate_p0}))} value={fmt2.format} label="Lima wilayah dengan kemiskinan tertinggi" unit="%" scaleMax={45}/><div className="chart-foot">P0 · persentase penduduk miskin · skala dimulai dari 0</div></div></Panel>
    <Panel eyebrow="SINYALE LAYANAN DASAR" title="Sanitasi layak masih sangat rendah di beberapa wilayah" description="Lima wilayah dengan akses sanitasi terendah di antara daerah ber-P0 ≥ 20%. Indikator ini membantu mengidentifikasi kebutuhan layanan dasar. "><div className="chart-wrap"><BarChart rows={[...filtered].filter(d=>d.poverty_rate_p0>=20).sort((a,b)=>a.sanitation_access_pct-b.sanitation_access_pct).slice(0,5).map(d=>({name:d.kab_kota,value:d.sanitation_access_pct}))} value={fmt2.format} label="Akses sanitasi pada daerah berkemiskinan tinggi" unit="%" scaleMax={100}/><div className="chart-foot">Akses sanitasi layak · persen rumah tangga · skala dimulai dari 0</div></div></Panel></div>
    <Panel eyebrow="DATA DAERAH" title="Mulai penelaahan dari daerah dengan P0 tertinggi" description="Gunakan daftar prioritas untuk menemukan wilayah, lalu tinjau sanitasi, air, pendidikan, dan pasar kerja sebelum menyusun intervensi. Nilai ini adalah sinyal awal, bukan rekomendasi anggaran otomatis."><div className="table-wrap"><table><thead><tr><th>Wilayah</th><th>Provinsi</th><th>P0</th><th>Sanitasi</th><th>Air layak</th><th>RLS</th><th>TPAK</th></tr></thead><tbody>{[...sorted].reverse().slice(0,20).map(d=><tr key={`${d.provinsi}-${d.kab_kota}`}><td>{d.kab_kota}</td><td>{d.provinsi.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}</td><td className={d.poverty_rate_p0>=30?'critical':''}>{pct(d.poverty_rate_p0)}</td><td>{pct(d.sanitation_access_pct)}</td><td>{pct(d.clean_water_access_pct)}</td><td>{fmt2.format(d.avg_school_years)} th</td><td>{pct(d.labor_participation_tpak)}</td></tr>)}</tbody></table></div><p className="table-note">Menampilkan {Math.min(20,sorted.length)} wilayah dengan P0 tertinggi dari {filtered.length} hasil filter.</p></Panel>
    <footer className="footer"><span>PovertyRadar · Storytelling kemiskinan daerah</span><span>Sumber: data/processed/poverty_clusters.csv · BPS 2021</span></footer></>}
    </main></div>
}

function fmt1(n:number) { return fmt.format(n) }
