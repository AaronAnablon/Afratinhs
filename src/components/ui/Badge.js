import { HiOutlineCheck, HiOutlineClock, HiOutlineXMark } from "react-icons/hi2";
import { Spinner } from "./Spinner";

const TONES = {
    slate: "bg-slate-100 text-slate-700",
    brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
    amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

export const Badge = ({ tone = "slate", className = "", children }) => (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-slate-500/10 ${TONES[tone]} ${className}`}>
        {children}
    </span>
);

// Present / absent pill for one attendance check (IN or OUT). `pending` shows
// "Not yet" for a check that hasn't been recorded. Clickable when `onToggle` is set.
export const StatusPill = ({ label, present, pending = false, onToggle, saving = false }) => {
    const state = present ? "present" : pending ? "pending" : "absent";
    const icons = { present: HiOutlineCheck, absent: HiOutlineXMark, pending: HiOutlineClock };
    const Icon = icons[state];
    const content = (
        <>
            {saving ? <Spinner className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
            <span>{{ present: "Present", absent: "Absent", pending: "Not yet" }[state]}</span>
        </>
    );
    const tone = {
        present: "bg-brand-50 text-brand-700 ring-brand-600/25",
        absent: "bg-red-50/60 text-red-700 ring-red-600/20",
        pending: "bg-slate-50 text-slate-500 ring-slate-400/25",
    }[state];
    const base = `inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone}`;

    if (!onToggle) return <span className={base}>{content}</span>;
    const next = present ? "absent" : "present";
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={saving}
            title={`Mark ${label} as ${next}`}
            aria-label={`${label}: ${{ present: "Present", absent: "Absent", pending: "Not yet" }[state]}. Mark as ${next}.`}
            className={`${base} transition hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-60`}
        >
            {content}
        </button>
    );
};
