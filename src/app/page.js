"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineAcademicCap, HiOutlineArrowRight, HiOutlineBookOpen, HiOutlineCalendarDays,
  HiOutlineCamera, HiOutlineDocumentText, HiOutlineShieldCheck,
} from "react-icons/hi2";
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Feedback';
import { DEMO_ACCOUNTS, DEMO_FACE_PHOTOS, DEMO_LIVE_CLASS_MINUTES, DEMO_MODE, DEMO_VISITOR_TTL_HOURS } from '@/globalData/demoAccounts';

const ROLE_ICONS = {
  Admin: HiOutlineShieldCheck,
  Teacher: HiOutlineBookOpen,
  Student: HiOutlineAcademicCap,
}

const STEPS = [
  {
    icon: HiOutlineCalendarDays,
    title: "Admin sets up classes",
    text: "Add teacher accounts, schedule classes or events for each section, enroll students and register a face photo for each one.",
  },
  {
    icon: HiOutlineCamera,
    title: "Teacher takes attendance",
    text: "Open a scheduled class and start the camera. Students are recognized by face and marked present for time in and time out.",
  },
  {
    icon: HiOutlineDocumentText,
    title: "Students check their record",
    text: "Students see their schedule and attendance history, and can upload an excuse letter for a class they missed.",
  },
]

export default function Home() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "form" while the login form is submitting, or the role of the demo account being signed in
  const [loading, setLoading] = useState(null)
  const router = useRouter()
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.replace("/AuthenticateAccount")
    }
  }, [session, router])

  const logIn = async (email, password, source) => {
    setLoading(source)
    try {
      const response = await signIn('credentials', { email, password, redirect: false });
      if (response?.ok) {
        router.replace("/AuthenticateAccount")
        return;
      }
      toast.error(source === "form" ? "Wrong email or password." : "Couldn't open the demo right now. Please try again in a moment.")
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
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
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <Image height={40} width={40} src={"/logo.png"} alt='' priority />
            <div className="leading-tight">
              <p className="font-bold tracking-wide text-brand-800">AFRATINHS</p>
              <p className="hidden text-xs text-slate-500 sm:block">Talangan Integrated National High School</p>
            </div>
          </a>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            <a href="#how-it-works" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:block">How it works</a>
            {DEMO_MODE && <a href="#demo" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:block">Try the demo</a>}
            <a href="#login" className="rounded-lg bg-brand-700 px-4 py-2 text-white shadow-sm hover:bg-brand-800">Log in</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr,1fr] md:items-center md:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm ring-1 ring-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                Attendance Facial Recognition App
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
                Take class attendance by <span className="text-brand-700">recognizing faces</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                AFRATINHS is the attendance system of Talangan Integrated National High School.
                Teachers point a webcam at the class and each recognized student is marked present.
                Admins manage schedules and sections, and students can check their own attendance.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {DEMO_MODE && (
                  <a href="#demo" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-800">
                    Try the demo <HiOutlineArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                <a href="#how-it-works" className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                  How it works
                </a>
              </div>
            </div>

            <Card id="login" className="mx-auto w-full max-w-md scroll-mt-24 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <Image height={44} width={44} src={"/logo.png"} alt='' />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Log in</h2>
                  <p className="text-sm text-slate-500">Use the account your school gave you.</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="submit" size="lg" className="mt-2 w-full" loading={loading === "form"} disabled={!!loading}>Log in</Button>
              </form>
            </Card>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-16 border-y border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">How it works</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Three roles, one attendance record.</p>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Card className="h-full p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-white">
                        <step.icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-semibold text-brand-700">Step {index + 1}</span>
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {DEMO_MODE &&
          <section id="demo" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Try it with a demo account</h2>
            <p className="mt-2 max-w-3xl text-slate-600">
              Log in with one click, or copy the email and password into the form above. Nothing to set up:
              the demo comes with sample teachers, three sections of students and a week of classes with attendance.
              A guide inside the app walks you through it. Each visitor gets their own copy of the data, so nobody
              else sees your changes, and it&apos;s deleted after {DEMO_VISITOR_TTL_HOURS} hours.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {DEMO_ACCOUNTS.map((account) => {
                const RoleIcon = ROLE_ICONS[account.role]
                return (
                  <Card key={account.role} className="flex flex-col p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <RoleIcon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{account.role}</h3>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{account.description}</p>
                    <dl className="mt-5 grid gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-slate-500">Email</dt>
                        <dd className="select-all break-all font-mono text-slate-800">{account.email}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-slate-500">Password</dt>
                        <dd className="select-all break-all font-mono text-slate-800">{account.password}</dd>
                      </div>
                    </dl>
                    <Button
                      className="mt-5 w-full"
                      onClick={() => handleDemoLogin(account)}
                      loading={loading === account.role}
                      disabled={!!loading}
                    >
                      Log in as {account.role}
                    </Button>
                  </Card>
                )
              })}
            </div>
            <div className="mt-8 max-w-3xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
              <p>
                <span className="font-semibold">Face recognition:</span> the first time you log in from a browser,
                with any demo account, you register your face with {DEMO_FACE_PHOTOS} photos from slightly different angles, so
                the camera checks attendance more accurately. Your face stays private to your browser and is deleted with
                the rest of your demo after {DEMO_VISITOR_TTL_HOURS} hours.
              </p>
              <p className="mt-2">
                <span className="font-semibold">Your own class:</span> each login starts a {DEMO_LIVE_CLASS_MINUTES}-minute
                class for Demo Teacher. Log in as Teacher, open it, start the camera and you&apos;re recognized as Demo Student.
              </p>
            </div>
          </section>}
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>AFRATINHS · Attendance Facial Recognition App</p>
          <p>Talangan Integrated National High School · Nagcarlan, Laguna</p>
        </div>
      </footer>
    </div>
  )
}
