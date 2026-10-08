import { HiOutlineArrowPath, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { Button } from "./Button";

export const EmptyState = ({ icon: Icon, title, description, action, className = "" }) => (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center ${className}`}>
        {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
        )}
        <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
    </div>
);

export const ErrorState = ({ message, onRetry }) => (
    <EmptyState
        icon={HiOutlineExclamationTriangle}
        title="Couldn't load this page"
        description={message}
        action={onRetry && <Button variant="secondary" icon={HiOutlineArrowPath} onClick={onRetry}>Try again</Button>}
    />
);
