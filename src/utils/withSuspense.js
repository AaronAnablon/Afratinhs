import { Suspense } from "react";

// Pages that call useSearchParams need a Suspense boundary so Next.js can prerender them.
export const withSuspense = (Component) => {
    const WithSuspense = (props) => (
        <Suspense>
            <Component {...props} />
        </Suspense>
    );
    return WithSuspense;
};
