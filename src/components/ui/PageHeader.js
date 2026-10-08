import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export const PageHeader = ({ title, description, back, actions, children }) => (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
            {back && (
                <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
                    <HiOutlineArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {back.label}
                </Link>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            {children}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
);
