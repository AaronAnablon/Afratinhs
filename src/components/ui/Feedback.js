"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineInformationCircle, HiOutlineXMark } from "react-icons/hi2";
import { Button } from "./Button";
import { Modal } from "./Modal";

const FeedbackContext = createContext(null);

const TOAST_STYLES = {
    success: { icon: HiOutlineCheckCircle, className: "text-brand-600" },
    error: { icon: HiOutlineExclamationTriangle, className: "text-red-600" },
    info: { icon: HiOutlineInformationCircle, className: "text-sky-600" },
};

// Provides useToast() for short non-blocking messages and useConfirm() for
// "are you sure?" dialogs that resolve to true or false.
export const FeedbackProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [pendingConfirm, setPendingConfirm] = useState(null);

    const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

    const toast = useMemo(() => {
        const push = (tone, message) => {
            const id = `${Date.now()}-${Math.random()}`;
            setToasts((current) => [...current.slice(-2), { id, tone, message }]);
            setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
        };
        return {
            success: (message) => push("success", message),
            error: (message) => push("error", message),
            info: (message) => push("info", message),
        };
    }, [dismiss]);

    const confirm = useCallback((options) => new Promise((resolve) => setPendingConfirm({ ...options, resolve })), []);

    const settle = (result) => {
        pendingConfirm?.resolve(result);
        setPendingConfirm(null);
    };

    const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6 lg:bottom-6">
                {toasts.map(({ id, tone, message }) => {
                    const { icon: Icon, className } = TOAST_STYLES[tone];
                    return (
                        <div key={id} className="pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-200 sm:w-96">
                            <Icon className={`h-5 w-5 shrink-0 ${className}`} aria-hidden="true" />
                            <p className="flex-1 text-sm text-slate-700">{message}</p>
                            <button type="button" onClick={() => dismiss(id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">
                                <HiOutlineXMark className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {pendingConfirm && (
                <Modal
                    size="sm"
                    title={pendingConfirm.title}
                    onClose={() => settle(false)}
                    footer={(
                        <>
                            <Button variant="secondary" onClick={() => settle(false)}>Cancel</Button>
                            <Button variant={pendingConfirm.tone === "danger" ? "danger" : "primary"} onClick={() => settle(true)}>
                                {pendingConfirm.confirmLabel ?? "Confirm"}
                            </Button>
                        </>
                    )}
                >
                    <p className="text-sm text-slate-600">{pendingConfirm.message}</p>
                </Modal>
            )}
        </FeedbackContext.Provider>
    );
};

export const useToast = () => useContext(FeedbackContext).toast;
export const useConfirm = () => useContext(FeedbackContext).confirm;
