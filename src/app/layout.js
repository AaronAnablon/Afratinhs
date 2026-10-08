import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from './contextProvider/AuthProvider'
import Favicon from "../../public/favicon.ico"
import { FeedbackProvider } from '@/components/ui/Feedback'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AFRATINHS',
  description: 'Attendance Facial Recognition App for Talangan Integrated National High School',
  icons: [{ rel: 'icon', url: Favicon.src }],
}

export const viewport = {
  themeColor: '#196139',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <FeedbackProvider>
            {children}
          </FeedbackProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
