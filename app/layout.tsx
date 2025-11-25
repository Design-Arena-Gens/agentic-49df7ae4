import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Email Agent - AI-Powered Email Assistant',
  description: 'Monitor emails, generate drafts, and auto-reply to basic messages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
