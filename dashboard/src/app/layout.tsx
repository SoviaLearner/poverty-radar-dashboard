import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'PovertyWatch | Data Kemiskinan Daerah',
  description: 'Ringkasan data kemiskinan dan kondisi sosial-ekonomi kabupaten/kota Indonesia, BPS 2021.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>
}
