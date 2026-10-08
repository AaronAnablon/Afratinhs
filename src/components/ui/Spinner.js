export const Spinner = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const PageLoader = ({ label = "Loading..." }) => (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
        <Spinner className="h-7 w-7 text-brand-700" />
        <p className="text-sm">{label}</p>
    </div>
);
