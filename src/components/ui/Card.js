export const Card = ({ className = "", children, ...props }) => (
    <div className={`rounded-xl bg-white shadow-card ring-1 ring-slate-200 ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ title, description, actions }) => (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
);

export const StatCard = ({ icon: Icon, label, value, tone = "brand" }) => {
    const tones = {
        brand: "bg-brand-50 text-brand-700",
        amber: "bg-amber-50 text-amber-700",
        sky: "bg-sky-50 text-sky-700",
        rose: "bg-rose-50 text-rose-700",
    };
    return (
        <Card className="flex items-center gap-4 p-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            </div>
        </Card>
    );
};
