import Link from "next/link";
import { Spinner } from "./Spinner";

const VARIANTS = {
    primary: "bg-brand-700 text-white shadow-sm hover:bg-brand-800",
    secondary: "bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    dangerGhost: "text-red-600 hover:bg-red-50",
};

const SIZES = {
    sm: "gap-1.5 px-2.5 py-1.5 text-xs",
    md: "gap-2 px-3.5 py-2 text-sm",
    lg: "gap-2 px-5 py-2.5 text-sm",
};

const buttonClass = (variant, size, className) =>
    `inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

export const Button = ({ variant = "primary", size = "md", icon: Icon, loading = false, className = "", children, disabled, type = "button", ...props }) => (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
        {loading ? <Spinner className="h-4 w-4" /> : Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {children}
    </button>
);

export const ButtonLink = ({ variant = "primary", size = "md", icon: Icon, className = "", children, ...props }) => (
    <Link className={buttonClass(variant, size, className)} {...props}>
        {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {children}
    </Link>
);

// Square icon-only button for row actions. `label` is read by screen readers and shown on hover.
export const IconButton = ({ icon: Icon, label, tone = "default", className = "", ...props }) => (
    <button
        type="button"
        title={label}
        aria-label={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50 ${tone === "danger" ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"} ${className}`}
        {...props}
    >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
);
