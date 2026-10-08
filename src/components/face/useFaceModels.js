"use client"

import { useEffect, useState } from "react";
import { ensureModelsLoaded, modelsLoaded } from "@/app/faceUtil";

// { ready, error } for the face recognition models, loading them on first use.
export const useFaceModels = () => {
    const [state, setState] = useState(() => ({ ready: modelsLoaded(), error: "" }));

    useEffect(() => {
        if (state.ready) return;
        let active = true;
        ensureModelsLoaded().then(
            () => active && setState({ ready: true, error: "" }),
            () => active && setState({ ready: false, error: "Couldn't load face recognition. Check your internet connection and reload the page." }),
        );
        return () => {
            active = false;
        };
    }, [state.ready]);

    return state;
};
