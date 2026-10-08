import { useId } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

export const inputClass = "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:bg-slate-50 disabled:text-slate-500";

// Label + control + optional hint or error. The control receives the generated id.
export const Field = ({ label, hint, error, className = "", children }) => {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
            {children(id)}
            {error
                ? <p className="mt-1.5 text-xs text-red-600">{error}</p>
                : hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        </div>
    );
};

export const TextField = ({ label, hint, error, className, ...props }) => (
    <Field label={label} hint={hint} error={error} className={className}>
        {(id) => (
            <input
                id={id}
                className={`${inputClass} ${error ? "ring-red-400 focus:ring-red-500" : ""}`}
                aria-invalid={error ? "true" : undefined}
                {...props}
            />
        )}
    </Field>
);

export const SelectField = ({ label, hint, error, className, children, ...props }) => (
    <Field label={label} hint={hint} error={error} className={className}>
        {(id) => (
            <select id={id} className={inputClass} {...props}>
                {children}
            </select>
        )}
    </Field>
);

export const SearchInput = ({ value, onChange, placeholder = "Search", className = "" }) => (
    <div className={`relative ${className}`}>
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className={`${inputClass} pl-9`}
        />
    </div>
);

// Small toggle between a few options, e.g. Upcoming / Past.
export const Segmented = ({ options, value, onChange, className = "" }) => (
    <div className={`inline-flex rounded-lg bg-slate-100 p-1 ${className}`} role="tablist">
        {options.map((option) => (
            <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={value === option.value}
                onClick={() => onChange(option.value)}
                disabled={option.disabled}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${value === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
                {option.label}
            </button>
        ))}
    </div>
);
