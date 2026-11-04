import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'PovertyRadar | Cerita Kemiskinan Daerah',
  description: 'Dashboard storytelling data kemiskinan kabupaten/kota Indonesia berdasarkan BPS 2021.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>
}
