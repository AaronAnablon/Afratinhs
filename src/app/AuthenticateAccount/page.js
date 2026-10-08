"use client"

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/Spinner';
import { isDemoEmail } from '@/globalData/demoAccounts';
import { ROLE_HOME } from '@/globalData/roles';
import { api } from '@/utils/http';

// Sends a freshly logged-in user to their role's home page. Demo visitors
// register their own face first.
const Page = () => {
    const { data: session, status } = useSession();
    const router = useRouter()

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.replace("/")
            return;
        }

        const goToRolePage = () => router.replace(ROLE_HOME[session.role] ?? "/")
        if (!isDemoEmail(session.email)) {
            goToRolePage()
            return;
        }

        api.get("/api/demoFace")
            .then((response) => response.data.registered ? goToRolePage() : router.replace("/DemoFace"))
            .catch(goToRolePage)
    }, [session, status, router])

    return <PageLoader label="Signing you in..." />;
}

export default Page;
