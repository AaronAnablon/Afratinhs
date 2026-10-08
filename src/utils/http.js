import axios from "axios";
import { useCallback, useEffect, useState } from "react";

// Same-origin requests, so the session and demo visitor cookies are always sent.
export const api = axios.create({ headers: { "Content-Type": "application/json" } });

export const errorMessage = (error) =>
    error?.response?.data?.message || "Something went wrong. Please try again.";

// Loads JSON from `url` (skipped while it is null). Keeps showing the previous
// data while reloading, so lists don't flash empty after every change.
export const useFetch = (url) => {
    const [state, setState] = useState({ url: null, data: undefined, error: null });
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!url) return;
        let cancelled = false;
        api.get(url).then(
            (response) => !cancelled && setState({ url, data: response.data, error: null }),
            (error) => !cancelled && setState((current) => ({ ...current, url, error: errorMessage(error) })),
        );
        return () => {
            cancelled = true;
        };
    }, [url, version]);

    const reload = useCallback(() => setVersion((current) => current + 1), []);
    const fresh = state.url === url;
    return {
        data: fresh ? state.data : undefined,
        error: fresh ? state.error : null,
        loading: Boolean(url) && (!fresh || (state.data === undefined && !state.error)),
        reload,
        // Lets a page update its copy right away after a successful save.
        mutate: (updater) => setState((current) => ({ ...current, data: typeof updater === "function" ? updater(current.data) : updater })),
    };
};
