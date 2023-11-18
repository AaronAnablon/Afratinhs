import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from './contextProvider/AuthProvider'
import Favicon from "../../public/favicon.ico"
import { AccountProvider } from './contextProvider/AccountProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AFRATINHS',
  description: 'Attendance Facial Recognition App For Tinangan Integrated High School',
  icons: [{ rel: 'icon', url: Favicon.src }],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AccountProvider>
            {children}
          </AccountProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
