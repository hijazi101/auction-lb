import './globals.css'; 

import { type Metadata } from 'next'

import { Geist, Geist_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
  
  <html lang="en">
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      
      {/* Navbar outside the header */}
      <Navbar />

      {/* Optional: keep header for buttons only */}
      <header className="flex justify-end items-center p-4 gap-4 h-16">
       
      </header>

      {children}
    </body>
  </html>


  )
}