import { Montserrat, Karla } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800']
})

const karla = Karla({ 
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['300', '400', '500', '600']
})

export const metadata = {
  title: 'Learnify - Master Anything with AI-Powered Learning',
  description: 'AI-powered spaced repetition learning platform with knowledge graphs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${montserrat.variable} ${karla.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
