"use client"

import { useEffect, useId } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

// Dialog that slides up from the bottom on phones and is centered on larger screens.
export const Modal = ({ title, description, onClose, footer, size = "md", children }) => {
    const titleId = useId();

    useEffect(() => {
        const onKeyDown = (event) => event.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${SIZES[size]}`}
            >
                <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5">
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-lg font-semibold text-slate-900">{title}</h2>
                        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="-mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <HiOutlineXMark className="h-5 w-5" />
                        </button>
                    )}
                </div>
                <div className="overflow-y-auto px-5 py-3">{children}</div>
                {footer && (
                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
