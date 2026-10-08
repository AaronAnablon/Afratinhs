export const ProfileDetails = ({ person }) => {
    const details = [
        ["Section", person.section],
        ["Adviser", person.adviser],
        ["Contact", person.contact],
        ["Address", person.homeAddress],
        ["Age", person.age],
    ];
    return (
        <dl className="grid gap-3 text-sm">
            {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-900">{value || "—"}</dd>
                </div>
            ))}
        </dl>
    );
};

export const SummaryStats = ({ summary }) => (
    <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
        {[["Present", summary.present, "text-brand-700"], ["Absent", summary.absent, "text-red-600"], ["Letters", summary.letters, "text-slate-900"]].map(([label, value, color]) => (
            <div key={label} className="px-2 py-3">
                <p className={`text-2xl font-semibold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
            </div>
        ))}
    </div>
);
