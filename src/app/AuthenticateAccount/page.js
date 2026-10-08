"use client"

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { isDemoEmail } from '@/globalData/demoAccounts';
import { ROLE_HOME } from '@/globalData/roles';
import { api } from '@/utils/http';

// Sends a freshly logged-in user to their role's home page. For demo users it
// first starts this browser's demo: a new browser (no visitor cookie, or an
// expired one) gets a new visitor ID and its own copy of the demo data, and
// has to register its face before going on.
const Page = () => {
    const { data: session, status } = useSession();
    const router = useRouter()
    const [attempt, setAttempt] = useState(0)
    const [failed, setFailed] = useState(false)
    // Starts the demo once per attempt, even when effects run twice in development.
    const startedAttempt = useRef(-1)

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.replace("/")
            return;
        }

        const goToRolePage = () => router.replace(ROLE_HOME[session.role] ?? "/")
        if (session.isDemo !== true && !isDemoEmail(session.email)) {
            goToRolePage()
            return;
        }

        if (startedAttempt.current === attempt) return;
        startedAttempt.current = attempt
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        api.post("/api/demo/session", { timeZone })
            .then((response) => response.data.face.registered ? goToRolePage() : router.replace("/DemoFace"))
            .catch(() => setFailed(true))
    }, [session, status, router, attempt])

    if (failed) {
        return (
            <main className="grid min-h-screen place-items-center px-4">
                <div className="grid gap-3">
                    <ErrorState
                        message="Couldn't start your demo. Please try again."
                        onRetry={() => {
                            setFailed(false)
                            setAttempt((current) => current + 1)
                        }}
                    />
                    <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>Log out</Button>
                </div>
            </main>
        );
    }

    return <PageLoader label="Signing you in..." />;
}

export default Page;
