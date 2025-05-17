import type { Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import './globals.css'
import { Toaster } from 'sonner'
import { CartProvider } from '@/lib/cart-context'
import { RootLayoutWrapper } from './root-layout-wrapper'

export const metadata: Metadata = {
  title: 'CleanDrives Car Wash System',
  description: 'Book car wash services and more',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`antialiased`}>
          <RootLayoutWrapper>
            <CartProvider>
              {children}
            </CartProvider>
          </RootLayoutWrapper>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}