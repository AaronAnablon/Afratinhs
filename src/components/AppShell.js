"use client"

import { createContext, useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { HiOutlineArrowRightOnRectangle, HiOutlineCamera, HiOutlineFaceSmile } from "react-icons/hi2";
import { ROLE_HOME, ROLE_NAMES } from "@/globalData/roles";
import { isDemoEmail } from "@/globalData/demoAccounts";
import { useFetch } from "@/utils/http";
import { DemoGuide } from "./DemoGuide";
import { Avatar, fullName } from "./ui/Avatar";
import { ErrorState } from "./ui/EmptyState";
import { useConfirm } from "./ui/Feedback";
import { PageLoader } from "./ui/Spinner";
import { ProfilePhotoDialog } from "./ProfilePhotoDialog";

const CurrentUserContext = createContext(null);

// { user, reload, isDemo } for the logged-in person inside the app shell.
export const useCurrentUser = () => useContext(CurrentUserContext);

const isActive = (pathname, item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

const menuItemClass = "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900";

const Brand = ({ href }) => (
    <Link href={href} className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
        <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide text-brand-800">AFRATINHS</p>
            <p className="text-[11px] text-slate-500">Talangan INHS</p>
        </div>
    </Link>
);

// Layout for logged-in pages: sidebar on desktop, top bar and bottom tabs on
// phones. Only renders for the given role; anyone else is sent away.
export const AppShell = ({ role, nav, children }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const confirm = useConfirm();
    const [photoOpen, setPhotoOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const allowed = status === "authenticated" && session?.role === role;
    const isDemo = allowed && (session.isDemo === true || isDemoEmail(session.email));
    const { data: profile, reload } = useFetch(allowed ? `/api/people/${session.id}` : null);
    // Demo visitors need an active visitor cookie (their own copy of the demo
    // data) and a registered face before they can use the app.
    const demo = useFetch(isDemo ? "/api/demo/session" : null);
    const demoReady = !isDemo || (demo.data?.visitor && demo.data.face.registered);
    // Check again on every page change, e.g. after the visitor's 24 hours are
    // up, and so the demo guide sees attendance that was just saved.
    const [demoPath, setDemoPath] = useState(pathname);
    if (demoPath !== pathname) {
        setDemoPath(pathname);
        demo.reload();
    }

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/");
        else if (status === "authenticated" && session?.role !== role) router.replace(ROLE_HOME[session?.role] ?? "/");
    }, [status, session, role, router]);

    useEffect(() => {
        if (!demo.data) return;
        if (!demo.data.visitor) router.replace("/AuthenticateAccount");
        else if (!demo.data.face.registered) router.replace("/DemoFace");
    }, [demo.data, router]);

    if (!allowed) return <PageLoader />;
    if (!demoReady) {
        return demo.error
            ? <main className="grid min-h-screen place-items-center px-4"><ErrorState message={demo.error} onRetry={demo.reload} /></main>
            : <PageLoader />;
    }

    const user = profile ?? session;
    const home = ROLE_HOME[role];

    const logOut = async () => {
        setMenuOpen(false);
        const ok = await confirm({ title: "Log out?", message: "You'll need your email and password to log back in.", confirmLabel: "Log out" });
        if (ok) signOut({ callbackUrl: "/" });
    };

    const openPhoto = () => {
        setMenuOpen(false);
        setPhotoOpen(true);
    };

    return (
        <CurrentUserContext.Provider value={{ user, reload, isDemo }}>
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
                <div className="flex h-16 items-center border-b border-slate-100 px-5">
                    <Brand href={home} />
                </div>
                <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
                    {nav.map((item) => {
                        const active = isActive(pathname, item);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                            >
                                <item.icon className={`h-5 w-5 ${active ? "text-brand-700" : "text-slate-400"}`} aria-hidden="true" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-slate-100 p-3">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <Avatar person={user} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{fullName(user)}</p>
                            <p className="truncate text-xs text-slate-500">{ROLE_NAMES[role]}{isDemo && " · Demo"}</p>
                        </div>
                    </div>
                    <button type="button" onClick={openPhoto} className={menuItemClass}>
                        <HiOutlineCamera className="h-5 w-5 text-slate-400" aria-hidden="true" /> Profile photo
                    </button>
                    {isDemo && (
                        <Link href="/DemoFace" className={menuItemClass}>
                            <HiOutlineFaceSmile className="h-5 w-5 text-slate-400" aria-hidden="true" /> Your demo face
                        </Link>
                    )}
                    <button type="button" onClick={logOut} className={menuItemClass}>
                        <HiOutlineArrowRightOnRectangle className="h-5 w-5 text-slate-400" aria-hidden="true" /> Log out
                    </button>
                </div>
            </aside>

            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
                <Brand href={home} />
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label="Account menu"
                        aria-expanded={menuOpen}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                        <Avatar person={user} size="sm" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                            <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
                                <div className="border-b border-slate-100 px-2.5 pb-2 pt-1">
                                    <p className="truncate text-sm font-medium text-slate-900">{fullName(user)}</p>
                                    <p className="truncate text-xs text-slate-500">{ROLE_NAMES[role]}{isDemo && " · Demo"}</p>
                                </div>
                                <div className="pt-1">
                                    <button type="button" onClick={openPhoto} className={menuItemClass}>
                                        <HiOutlineCamera className="h-5 w-5 text-slate-400" aria-hidden="true" /> Profile photo
                                    </button>
                                    {isDemo && (
                                        <Link href="/DemoFace" className={menuItemClass}>
                                            <HiOutlineFaceSmile className="h-5 w-5 text-slate-400" aria-hidden="true" /> Your demo face
                                        </Link>
                                    )}
                                    <button type="button" onClick={logOut} className={menuItemClass}>
                                        <HiOutlineArrowRightOnRectangle className="h-5 w-5 text-slate-400" aria-hidden="true" /> Log out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <main className="pb-24 lg:pb-10 lg:pl-64">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {isDemo && <DemoGuide role={role} status={demo.data} reload={demo.reload} showSteps={isDemoEmail(session.email)} />}
                    {children}
                </div>
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
                style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
                aria-label="Main"
            >
                {nav.map((item) => {
                    const active = isActive(pathname, item);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-brand-700" : "text-slate-500"}`}
                        >
                            <item.icon className="h-6 w-6" aria-hidden="true" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {photoOpen && (
                <ProfilePhotoDialog user={user} isDemo={isDemo} onClose={() => setPhotoOpen(false)} onSaved={reload} />
            )}
        </CurrentUserContext.Provider>
    );
};
