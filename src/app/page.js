"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image'
import { url, headers } from '@/utils/api';
import { signIn } from 'next-auth/react';
import axios from "axios";
import { PublicRoute } from '@/utils/auth';
import { LoadingSpin } from '@/utils/LoadingSpin';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useMessageHook from '@/utils/MessageHook';
import { DEMO_ACCOUNTS } from '@/globalData/demoAccounts';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate, FaCamera, FaCalendarAlt, FaEnvelopeOpenText } from "react-icons/fa";

const ROLE_ICONS = {
  Admin: FaUserShield,
  Teacher: FaChalkboardTeacher,
  Student: FaUserGraduate,
}

const STEPS = [
  {
    icon: FaCalendarAlt,
    title: "Admin sets up classes",
    text: "Add teacher accounts, schedule classes or events for each section, enroll students and register a face photo for each one.",
  },
  {
    icon: FaCamera,
    title: "Teacher takes attendance",
    text: "Open a scheduled class and start the camera. Students are recognized by face and marked present for time in and time out.",
  },
  {
    icon: FaEnvelopeOpenText,
    title: "Students check their record",
    text: "Students see their schedule and attendance history, and can upload an excuse letter for a class they missed.",
  },
]

export default function Home() {
  const { showMessage, Message } = useMessageHook();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "form" while the login form is submitting, or the role of the demo account being signed in
  const [loading, setLoading] = useState(null)
  const router = useRouter()
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push(`${url}AuthenticateAccount`)
    }
  }, [session, router])

  const logIn = async (email, password, source) => {
    setLoading(source)
    try {
      const emailCheck = await axios.get(`${url}/api/findByEmail/${email}`, { headers });
      if (Array.isArray(emailCheck.data) && emailCheck.data.length > 0) {
        const response = await signIn('credentials', {
          email: email,
          password: password,
          redirect: false,
        });
        response.ok && router.push(`${url}AuthenticateAccount`)
        response.error && showMessage("Failed to Login! Please check the email or password.")
      } else {
        showMessage(source === "form" ? "You don't have account yet!" : "This demo account is not set up yet.")
      }
    } catch (error) {
      console.error(error)
      showMessage("Something went wrong! Please try again.")
    }
    setLoading(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    logIn(email, password, "form")
  };

  const handleDemoLogin = (account) => {
    setEmail(account.email)
    setPassword(account.password)
    logIn(account.email, account.password, account.role)
  }

  return (
    <main className="min-h-screen bg-white text-gray-800">
      <Message />
      <PublicRoute>
        <header className="border-b border-green-700/20">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-green-700">
              <Image height={40} width={40} src={"/logo.png"} alt='logo' />
              <div className="leading-tight">
                <p className="font-bold tracking-wide">AFRATINHS</p>
                <p className="text-xs text-gray-600">Talangan Integrated National High School</p>
              </div>
            </div>
            <a href="#login" className="bg-green-700 text-white text-sm px-4 py-2 rounded-full hover:bg-green-600">Log In</a>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-green-700 text-sm font-semibold uppercase tracking-wider">Attendance Facial Recognition App</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              Take class attendance by recognizing faces
            </h1>
            <p className="mt-5 text-gray-600 md:text-lg">
              AFRATINHS is the attendance system of Talangan Integrated National High School.
              Teachers point a webcam at the class and each recognized student is marked present.
              Admins manage schedules and sections, and students can check their own attendance.
            </p>
            {DEMO_ACCOUNTS.length > 0 &&
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#demo" className="bg-green-700 text-white px-5 py-2 rounded-full hover:bg-green-600">Try the demo</a>
                <a href="#how-it-works" className="border border-green-700 text-green-700 px-5 py-2 rounded-full hover:bg-green-50">How it works</a>
              </div>}
          </div>

          <div id="login" className="text-green-700 w-full max-w-sm mx-auto p-8 border border-green-700/30 rounded-xl shadow-sm scroll-mt-8">
            <div className="flex mb-6 justify-center w-full items-center">
              <div className='w-1/4 flex justify-center'>
                <Image height={64} width={64} src={"/logo.png"} alt='logo' />
              </div>
              <h2 className="w-3/4 text-center">Log in to your account</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 text-sm">
                <input
                  type="email"
                  className="w-full text-xs px-3 py-2 border border-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  className="w-full text-xs px-3 py-2 border border-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2 my-4 bg-green-700 rounded-full text-white px-4 `}
                disabled={!!loading}
              >
                {loading === "form" ? <LoadingSpin loading={true} /> : "Log In"}
              </button>
            </form>
          </div>
        </section>

        <section id="how-it-works" className="bg-green-50 scroll-mt-4">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">How it works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="bg-white rounded-xl p-6 border border-green-700/20">
                  <div className="flex items-center gap-3 text-green-700">
                    <div className="bg-green-700 text-white p-2 rounded-full">
                      <step.icon size={18} />
                    </div>
                    <span className="text-sm font-semibold">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {DEMO_ACCOUNTS.length > 0 &&
          <section id="demo" className="max-w-6xl mx-auto px-4 py-16 scroll-mt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Try it with a demo account</h2>
            <p className="mt-3 text-gray-600 max-w-3xl">
              Log in with one click, or copy the email and password into the form above.
              Demo data is shared by all visitors and is reset from time to time.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {DEMO_ACCOUNTS.map((account) => {
                const RoleIcon = ROLE_ICONS[account.role]
                return (
                  <div key={account.role} className="flex flex-col rounded-xl p-6 border border-green-700/30">
                    <div className="flex items-center gap-3 text-green-700">
                      <RoleIcon size={24} />
                      <h3 className="text-lg font-semibold">{account.role}</h3>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 flex-1">{account.description}</p>
                    <dl className="mt-4 text-sm grid gap-1">
                      <div className="flex gap-2">
                        <dt className="text-gray-500 w-20 shrink-0">Email</dt>
                        <dd className="font-mono break-all select-all">{account.email}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-gray-500 w-20 shrink-0">Password</dt>
                        <dd className="font-mono break-all select-all">{account.password}</dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin(account)}
                      disabled={!!loading}
                      className="mt-5 w-full py-2 bg-green-700 rounded-full text-white px-4 hover:bg-green-600"
                    >
                      {loading === account.role ? <LoadingSpin loading={true} /> : `Log in as ${account.role}`}
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="mt-8 text-sm text-gray-600 max-w-3xl">
              <span className="font-semibold text-gray-800">Tip:</span> to see face recognition work,
              log in as Admin, open Sections &rarr; Demo Section &rarr; Demo Student &rarr; Upload Profile and
              add a photo of your face. Then log in as Teacher, open a class under Schedule, let the camera
              recognize you, and untick &quot;Open&quot; to save the attendance.
            </p>
          </section>}

        <footer className="border-t border-green-700/20">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-gray-500">
            AFRATINHS &middot; Attendance Facial Recognition App for Talangan Integrated National High School
          </div>
        </footer>
      </PublicRoute>
    </main>
  )
}
