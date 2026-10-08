"use client"

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { HiOutlineArrowsRightLeft, HiOutlineCheck, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineMap } from "react-icons/hi2";
import { DEMO_ACCOUNTS, DEMO_FACE_PHOTOS, DEMO_LIVE_CLASS_MINUTES } from "@/globalData/demoAccounts";
import { ADMIN, ROLE_HOME, STUDENT, TEACHER } from "@/globalData/roles";
import { displayTime, parseClassDate, relativeDayLabel } from "@/utils/schedule";
import { Badge } from "./ui/Badge";
import { Button, ButtonLink } from "./ui/Button";
import { useToast } from "./ui/Feedback";

// Pages this tab has opened and whether the guide is expanded, kept for the
// browser tab so steps stay checked while switching between demo accounts.
const VISITED_KEY = "afratinhs-demo-visited";
const OPEN_KEY = "afratinhs-demo-guide-open";
const REFRESH_EVENT = "afratinhs:demo-guide-refresh";

// Lets a page tell the guide that something it tracks changed, e.g. attendance was saved.
export const refreshDemoGuide = () => window.dispatchEvent(new Event(REFRESH_EVENT));

const readStored = (key, fallback) => {
    try {
        const value = sessionStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
};

const writeStored = (key, value) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage can be unavailable (private mode); the guide then just forgets.
    }
};

const liveClassLabel = (live) => {
    const date = parseClassDate(live.date);
    return `${live.event}, ${date ? relativeDayLabel(date).toLowerCase() : live.date} ${displayTime(live.time)}`;
};

// Steps for each role. A step has either `href` or `switchTo` (a demo account role).
const stepsFor = (role, status, visited) => {
    const live = status.liveClass;
    const faceStep = {
        title: `Register your face (${DEMO_FACE_PHOTOS} photos)`,
        text: "So the camera can recognize you as Demo Student when attendance is taken.",
        href: "/DemoFace",
        done: status.face.registered,
    };

    if (role === ADMIN) return [
        faceStep,
        {
            title: "Check the teachers",
            text: "Demo Teacher and two sample teachers are ready.",
            href: "/Admin/TeacherSchedule",
            done: visited.includes("/Admin/TeacherSchedule"),
        },
        {
            title: "Open Demo Teacher's schedule",
            text: `A week of premade classes, plus the ${DEMO_LIVE_CLASS_MINUTES}-minute class that started when you logged in.`,
            href: `/Admin/TeacherSchedule/Schedule?id=${status.teacherId}`,
            done: visited.includes("/Admin/TeacherSchedule/Schedule"),
        },
        {
            title: "Browse the sections",
            text: "Three sections, each with its own students and classes.",
            href: "/Admin/Sections",
            done: visited.includes("/Admin/Sections"),
        },
        {
            title: `Check the students of ${status.section}`,
            text: "Open Demo Student to see their attendance and face photos.",
            href: `/Admin/Sections/Students?section=${encodeURIComponent(status.section)}`,
            done: visited.includes("/Admin/Sections/Students"),
        },
        {
            title: "Take attendance as the Teacher",
            text: "Switch to the Teacher account and start the camera in your live class.",
            switchTo: "Teacher",
            done: Boolean(live?.studentPresent),
        },
    ];

    if (role === TEACHER) return [
        faceStep,
        {
            title: "Take attendance in your live class",
            text: live
                ? `${liveClassLabel(live)}. Start the camera and you're recognized as Demo Student, then press Save.`
                : `A ${DEMO_LIVE_CLASS_MINUTES}-minute class starts when you log in. Start the camera and you're recognized as Demo Student.`,
            href: live ? `/Teacher/Schedule/RecordAttendance?AttendanceId=${live.id}` : "/Teacher/Schedule",
            done: Boolean(live?.studentPresent),
        },
        {
            title: "Review the attendance sheet",
            text: "Fix anyone the camera missed by clicking their status.",
            href: live ? `/Teacher/Schedule/CopyAttendance?AttendanceId=${live.id}` : "/Teacher/Schedule",
            done: visited.includes("/Teacher/Schedule/CopyAttendance"),
        },
        {
            title: "Look through your schedule",
            text: "Past classes already have attendance taken.",
            href: "/Teacher/Schedule",
            done: visited.includes("/Teacher/Schedule"),
        },
        {
            title: "Check your sections",
            text: "Your students and their attendance, per section.",
            href: "/Teacher/Sections",
            done: visited.includes("/Teacher/Sections"),
        },
        {
            title: "See it as the Student",
            text: "Switch to the Student account to see the attendance you took.",
            switchTo: "Student",
            done: visited.includes("/Student/Attendance"),
        },
    ];

    if (role === STUDENT) return [
        faceStep,
        {
            title: "Check your schedule",
            text: live
                ? `It includes your live class: ${liveClassLabel(live)}.`
                : `It includes the ${DEMO_LIVE_CLASS_MINUTES}-minute class that started when you logged in.`,
            href: "/Student/Schedule",
            done: visited.includes("/Student/Schedule"),
        },
        {
            title: "Check your attendance",
            text: "You missed a class yesterday. Upload an excuse letter for it.",
            href: "/Student/Attendance",
            done: visited.includes("/Student/Attendance"),
        },
        {
            title: "Get recognized by the Teacher",
            text: "Switch to the Teacher account and take attendance in your live class.",
            switchTo: "Teacher",
            done: Boolean(live?.studentPresent),
        },
    ];

    return [];
};

// Checklist at the top of every page for demo visitors: what to try next,
// with steps checked off as they go. `status` comes from /api/demo/session;
// accounts a visitor created themselves only get the header (`showSteps`).
export const DemoGuide = ({ role, status, reload, showSteps = true }) => {
    const toast = useToast();
    const pathname = usePathname();
    const [visited, setVisited] = useState(() => readStored(VISITED_KEY, []));
    // null follows the default: open on the role's home page only
    const [open, setOpen] = useState(() => readStored(OPEN_KEY, null));
    const [switching, setSwitching] = useState(null);

    if (!visited.includes(pathname)) setVisited([...visited, pathname]);

    useEffect(() => {
        writeStored(VISITED_KEY, visited);
    }, [visited]);

    useEffect(() => {
        window.addEventListener(REFRESH_EVENT, reload);
        return () => window.removeEventListener(REFRESH_EVENT, reload);
    }, [reload]);

    const expanded = open ?? pathname === ROLE_HOME[role];
    const toggle = () => {
        setOpen(!expanded);
        writeStored(OPEN_KEY, !expanded);
    };

    const switchTo = async (roleName) => {
        const account = DEMO_ACCOUNTS.find((demoAccount) => demoAccount.role === roleName);
        setSwitching(roleName);
        const response = await signIn("credentials", { email: account.email, password: account.password, redirect: false }).catch(() => null);
        if (response?.ok) {
            // A full page load, so the new account starts clean and the app
            // shell's own redirect for the old role can't race this one.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign("/AuthenticateAccount");
            return;
        }
        toast.error("Couldn't switch accounts. Please try again.");
        setSwitching(null);
    };

    const steps = showSteps && status ? stepsFor(role, status, visited) : [];
    const doneCount = steps.filter((step) => step.done).length;
    const nextIndex = steps.findIndex((step) => !step.done);

    const action = (step, index) => {
        const primary = index === nextIndex;
        if (step.switchTo) {
            return (
                <Button size="sm" variant={primary ? "primary" : "secondary"} icon={HiOutlineArrowsRightLeft} onClick={() => switchTo(step.switchTo)} loading={switching === step.switchTo} disabled={Boolean(switching)}>
                    Switch to {step.switchTo}
                </Button>
            );
        }
        return <ButtonLink size="sm" variant={primary ? "primary" : "ghost"} href={step.href}>{step.done ? "Open again" : "Open"}</ButtonLink>;
    };

    return (
        <section aria-label="Demo guide" className="mb-6 overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-amber-200">
            <div className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-3">
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        <HiOutlineMap className="h-5 w-5 text-amber-600" aria-hidden="true" />
                        Demo guide
                        {steps.length > 0 && <Badge tone={doneCount === steps.length ? "brand" : "amber"}>{doneCount} of {steps.length} done</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-900">
                        This browser has its own copy of the sample data, so other visitors never see your changes.
                        {status?.expiresAt && ` It's deleted, along with your face, on ${new Date(status.expiresAt).toLocaleString()}.`}
                    </p>
                </div>
                {steps.length > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        icon={expanded ? HiOutlineChevronUp : HiOutlineChevronDown}
                        onClick={toggle}
                        aria-expanded={expanded}
                        aria-label={expanded ? "Hide steps" : "Show steps"}
                    >
                        <span className="hidden sm:inline">{expanded ? "Hide steps" : "Show steps"}</span>
                    </Button>
                )}
            </div>

            {steps.length > 0 && (expanded ? (
                <ol className="divide-y divide-slate-100">
                    {steps.map((step, index) => (
                        <li key={step.title} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${index === nextIndex ? "bg-brand-50/40" : ""}`}>
                            <div className="flex min-w-0 items-start gap-3">
                                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step.done ? "bg-brand-700 text-white" : index === nextIndex ? "bg-white text-brand-700 ring-2 ring-brand-600" : "bg-slate-100 text-slate-500"}`}>
                                    {step.done
                                        ? <><HiOutlineCheck className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Done:</span></>
                                        : index + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className={`text-sm font-medium ${step.done ? "text-slate-500" : "text-slate-900"}`}>{step.title}</p>
                                    <p className="text-xs text-slate-500">{step.text}</p>
                                </div>
                            </div>
                            <div className="shrink-0 pl-9 sm:pl-0">{action(step, index)}</div>
                        </li>
                    ))}
                </ol>
            ) : (
                <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 text-sm text-slate-700">
                        {nextIndex >= 0
                            ? <><span className="font-medium text-slate-900">Next:</span> {steps[nextIndex].title}</>
                            : "You've tried everything in this account. Switch accounts or explore on your own."}
                    </p>
                    {nextIndex >= 0 && <div className="shrink-0">{action(steps[nextIndex], nextIndex)}</div>}
                </div>
            ))}
        </section>
    );
};
