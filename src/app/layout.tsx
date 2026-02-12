import type { Metadata } from 'next'
import { Press_Start_2P, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const arcade = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-arcade',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'Agent team command center',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${arcade.variable} ${mono.variable}`}>
      <body className={`${mono.className} boot-up`}>
        {/* CRT scanline overlay */}
        <div className="crt-overlay" />
        {children}
      </body>
    </html>
  )
}
